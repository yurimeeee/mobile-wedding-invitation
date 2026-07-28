import { NextResponse, type NextRequest } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAdminRequest } from '@/lib/admin-api-auth'
import { templates } from '@/lib/types'

export async function GET(request: NextRequest) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const [invitationsSnap, settingsSnap] = await Promise.all([
    adminDb.collection('invitations').get(),
    adminDb.collection('adminMeta').doc('templateSettings').get(),
  ])

  const usageByTemplate = new Map<string, number>()
  for (const doc of invitationsSnap.docs) {
    const template = doc.data().template as string | undefined
    if (!template) continue
    usageByTemplate.set(template, (usageByTemplate.get(template) ?? 0) + 1)
  }

  const disabledTemplateIds = new Set<string>(
    (settingsSnap.data()?.disabledTemplateIds as string[] | undefined) ?? []
  )

  const result = templates.map((tpl) => ({
    id: tpl.id,
    name: tpl.name,
    nameKr: tpl.nameKr,
    colors: tpl.colors,
    usageCount: usageByTemplate.get(tpl.id) ?? 0,
    disabled: disabledTemplateIds.has(tpl.id),
  }))

  return NextResponse.json({ templates: result })
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => null) as { templateId?: string; disabled?: boolean } | null
  if (typeof body?.templateId !== 'string' || typeof body?.disabled !== 'boolean') {
    return NextResponse.json({ error: 'templateId(string), disabled(boolean) 값이 필요합니다.' }, { status: 400 })
  }
  if (!templates.some((t) => t.id === body.templateId)) {
    return NextResponse.json({ error: '존재하지 않는 템플릿입니다.' }, { status: 400 })
  }

  const docRef = adminDb.collection('adminMeta').doc('templateSettings')
  await docRef.set(
    {
      disabledTemplateIds: body.disabled
        ? FieldValue.arrayUnion(body.templateId)
        : FieldValue.arrayRemove(body.templateId),
    },
    { merge: true }
  )

  return NextResponse.json({ templateId: body.templateId, disabled: body.disabled })
}
