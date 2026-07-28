import { NextResponse, type NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { requireAdminRequest } from '@/lib/admin-api-auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const { uid } = await params
  const body = await request.json().catch(() => null) as { disabled?: boolean } | null
  if (typeof body?.disabled !== 'boolean') {
    return NextResponse.json({ error: 'disabled(boolean) 값이 필요합니다.' }, { status: 400 })
  }

  await adminAuth.updateUser(uid, { disabled: body.disabled })
  return NextResponse.json({ id: uid, disabled: body.disabled })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const { uid } = await params
  if (uid === admin.uid) {
    return NextResponse.json({ error: '자기 자신의 계정은 삭제할 수 없습니다.' }, { status: 400 })
  }

  await adminAuth.deleteUser(uid)
  return NextResponse.json({ id: uid })
}
