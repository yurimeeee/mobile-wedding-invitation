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

  const snapshot = await adminDb.collection('invitations').get()
  const docs = snapshot.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    return { id: d.id, uid: data.uid, weddingInfo: data.weddingInfo, template: data.template, status: data.status, slug: data.slug, createdAt: data.createdAt, updatedAt: data.updatedAt }
  })

  const uniqueUids = Array.from(new Set(docs.map((d) => d.uid).filter((uid): uid is string => typeof uid === 'string')))

  const creatorByUid = new Map<string, { email: string; name: string }>()
  if (uniqueUids.length > 0) {
    const results = await Promise.all(
      uniqueUids.map(async (uid) => {
        try {
          const user = await adminAuth.getUser(uid)
          return [uid, { email: user.email ?? '', name: user.displayName ?? user.email ?? '알 수 없음' }] as const
        } catch {
          return [uid, { email: '', name: '탈퇴한 사용자' }] as const
        }
      })
    )
    for (const [uid, info] of results) creatorByUid.set(uid, info)
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
      views: 0,
      rsvps: 0,
    }
  })

  return NextResponse.json({ invitations })
}
