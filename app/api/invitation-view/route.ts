import { NextResponse, type NextRequest } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

// 조회수는 Firestore 보안 규칙상 클라이언트가 직접 올릴 수 없으므로(글쓰기는 소유자만)
// Admin SDK로 우회해서 처리한다. 발행된 청첩장만 카운트하고, 소유자 본인의 열람은 제외한다.
export async function POST(request: NextRequest) {
  const { id } = await request.json().catch(() => ({}))
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 })
  }

  const docRef = adminDb.collection('invitations').doc(id)
  const snap = await docRef.get()
  const data = snap.data()
  if (!snap.exists || data?.status !== 'published') {
    return NextResponse.json({ ok: false })
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (token) {
    try {
      const decoded = await adminAuth.verifyIdToken(token)
      if (decoded.uid === data.uid) return NextResponse.json({ ok: false })
    } catch {
      // 토큰이 유효하지 않으면 일반 방문으로 취급한다
    }
  }

  await docRef.update({ viewCount: FieldValue.increment(1) })
  return NextResponse.json({ ok: true })
}
