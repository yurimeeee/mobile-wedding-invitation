import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { requireAdminRequest } from '@/lib/admin-api-auth'

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!name || !email || password.length < 6) {
    return NextResponse.json({ error: 'invalid-input' }, { status: 400 })
  }

  try {
    const newUser = await adminAuth.createUser({ email, password, displayName: name })
    await adminDb.collection('adminUsers').doc(newUser.uid).set({
      email,
      name,
      role: 'admin',
      createdAt: FieldValue.serverTimestamp(),
      createdBy: admin.uid,
    })
    return NextResponse.json({ uid: newUser.uid })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown'
    return NextResponse.json({ error: code }, { status: 400 })
  }
}
