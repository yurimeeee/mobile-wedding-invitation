import { NextResponse, type NextRequest } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
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

  // Auth 계정만 지우면 해당 uid가 작성한 invitations와 그 하위 컬렉션이 소유자 없이
  // 영구히 남는다. 계정 삭제 전에 먼저 정리한다.
  const invitationsSnap = await adminDb.collection('invitations').where('uid', '==', uid).get()
  await Promise.all(invitationsSnap.docs.map((doc) => adminDb.recursiveDelete(doc.ref)))

  await adminAuth.deleteUser(uid)
  return NextResponse.json({ id: uid })
}
