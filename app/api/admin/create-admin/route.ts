import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let callerUid: string
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    callerUid = decoded.uid
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const callerAdminDoc = await adminDb.collection('adminUsers').doc(callerUid).get()
  if (!callerAdminDoc.exists) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

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
      createdBy: callerUid,
    })
    return NextResponse.json({ uid: newUser.uid })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? 'unknown'
    return NextResponse.json({ error: code }, { status: 400 })
  }
}
