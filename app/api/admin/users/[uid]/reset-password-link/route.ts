import { NextResponse, type NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { requireAdminRequest } from '@/lib/admin-api-auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const { uid } = await params

  try {
    const user = await adminAuth.getUser(uid)
    if (!user.email) {
      return NextResponse.json({ error: '이메일이 없는 계정입니다.' }, { status: 400 })
    }
    const link = await adminAuth.generatePasswordResetLink(user.email)
    return NextResponse.json({ link })
  } catch {
    return NextResponse.json({ error: '재설정 링크 생성에 실패했습니다.' }, { status: 400 })
  }
}
