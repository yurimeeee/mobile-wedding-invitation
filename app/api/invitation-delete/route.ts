import { NextResponse, type NextRequest } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

// invitations/{id} 문서만 지우면 messages·rsvps·versions·private(잠금 비밀번호)·
// *RateLimits·*Attempts 같은 서브컬렉션이 영구히 남는다. firestore.rules의 isOwner()는
// 부모 문서를 조회해 권한을 판단하므로, 부모가 사라지면 소유자도 클라이언트에서 그 데이터를
// 정리할 수 없다. 그래서 Admin SDK의 recursiveDelete로 문서와 모든 하위 컬렉션을 함께 지운다.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id } = await request.json().catch(() => ({}))
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
  }

  let uid: string
  try {
    uid = (await adminAuth.verifyIdToken(token)).uid
  } catch {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const docRef = adminDb.collection('invitations').doc(id)
  const snap = await docRef.get()
  if (!snap.exists) {
    return NextResponse.json({ ok: true })
  }
  if (snap.data()?.uid !== uid) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  await adminDb.recursiveDelete(docRef)

  return NextResponse.json({ ok: true })
}
