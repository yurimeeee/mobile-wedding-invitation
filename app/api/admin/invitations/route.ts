import { NextResponse, type NextRequest } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { requireAdminRequest } from '@/lib/admin-api-auth'
import { templates } from '@/lib/types'

function toIso(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const [snapshot, rsvpsSnap] = await Promise.all([
    adminDb.collection('invitations').get(),
    adminDb.collectionGroup('rsvps').select().get(),
  ])
  const docs = snapshot.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    return {
      id: d.id,
      uid: data.uid,
      weddingInfo: data.weddingInfo,
      template: data.template,
      status: data.status,
      slug: data.slug,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      viewCount: typeof data.viewCount === 'number' ? data.viewCount : 0,
    }
  })

  const rsvpCountByInvitation = new Map<string, number>()
  for (const rsvpDoc of rsvpsSnap.docs) {
    const invitationId = rsvpDoc.ref.parent.parent?.id
    if (!invitationId) continue
    rsvpCountByInvitation.set(invitationId, (rsvpCountByInvitation.get(invitationId) ?? 0) + 1)
  }

  const uniqueUids = Array.from(new Set(docs.map((d) => d.uid).filter((uid): uid is string => typeof uid === 'string')))

  // 사용자 수만큼 adminAuth.getUser를 개별 호출하면 요청마다 Auth API 호출이 선형으로
  // 늘어난다. getUsers는 한 번에 최대 100개까지 조회할 수 있어 묶어서 호출한다.
  const GET_USERS_BATCH_SIZE = 100
  const creatorByUid = new Map<string, { email: string; name: string }>()
  const batches: string[][] = []
  for (let i = 0; i < uniqueUids.length; i += GET_USERS_BATCH_SIZE) {
    batches.push(uniqueUids.slice(i, i + GET_USERS_BATCH_SIZE))
  }
  const batchResults = await Promise.all(
    batches.map((batch) => adminAuth.getUsers(batch.map((uid) => ({ uid }))))
  )
  for (const { users } of batchResults) {
    for (const user of users) {
      creatorByUid.set(user.uid, { email: user.email ?? '', name: user.displayName ?? user.email ?? '알 수 없음' })
    }
  }
  for (const uid of uniqueUids) {
    if (!creatorByUid.has(uid)) creatorByUid.set(uid, { email: '', name: '탈퇴한 사용자' })
  }

  const invitations = docs.map((d) => {
    const weddingInfo = d.weddingInfo as Record<string, string> | undefined
    const templateMeta = templates.find((t) => t.id === d.template)
    const creator = typeof d.uid === 'string' ? creatorByUid.get(d.uid) : undefined

    return {
      id: d.id,
      coupleNames: weddingInfo
        ? `${weddingInfo.groomLastNameKr ?? ''}${weddingInfo.groomFirstNameKr ?? ''} & ${weddingInfo.brideLastNameKr ?? ''}${weddingInfo.brideFirstNameKr ?? ''}`
        : '이름 미입력',
      groomName: weddingInfo ? `${weddingInfo.groomLastNameKr ?? ''}${weddingInfo.groomFirstNameKr ?? ''}` : '',
      brideName: weddingInfo ? `${weddingInfo.brideLastNameKr ?? ''}${weddingInfo.brideFirstNameKr ?? ''}` : '',
      creatorUid: d.uid ?? null,
      creatorEmail: creator?.email ?? '',
      creatorName: creator?.name ?? '',
      templateId: d.template ?? null,
      templateName: templateMeta?.nameKr ?? d.template ?? '알 수 없음',
      status: (d.status ?? 'draft') as 'draft' | 'published',
      slug: d.slug ?? '',
      createdAt: toIso(d.createdAt),
      updatedAt: toIso(d.updatedAt),
      views: d.viewCount,
      rsvps: rsvpCountByInvitation.get(d.id) ?? 0,
    }
  })

  return NextResponse.json({ invitations })
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => null) as { ids?: string[] } | null
  const MAX_BULK_DELETE = 50
  if (
    !Array.isArray(body?.ids) ||
    body.ids.length === 0 ||
    body.ids.length > MAX_BULK_DELETE ||
    !body.ids.every((id) => typeof id === 'string')
  ) {
    return NextResponse.json({ error: `ids(string[], 최대 ${MAX_BULK_DELETE}개) 값이 필요합니다.` }, { status: 400 })
  }

  await Promise.all(body.ids.map((id) => adminDb.recursiveDelete(adminDb.collection('invitations').doc(id))))
  return NextResponse.json({ ids: body.ids })
}
