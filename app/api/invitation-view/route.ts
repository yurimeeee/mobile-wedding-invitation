import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'crypto'
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

  // 같은 방문자가 새로고침을 반복해도 조회수가 무제한으로 오르지 않도록,
  // IP를 해시한 방문 기록을 하루 단위로 남기고 이미 기록이 있으면 집계에서 제외한다.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const today = new Date().toISOString().slice(0, 10)
  const visitorHash = createHash('sha256').update(`${ip}:${id}:${today}`).digest('hex')
  const viewLogRef = docRef.collection('viewLogs').doc(visitorHash)

  const counted = await adminDb.runTransaction(async (tx) => {
    const logSnap = await tx.get(viewLogRef)
    if (logSnap.exists) return false
    tx.set(viewLogRef, { createdAt: FieldValue.serverTimestamp() })
    tx.update(docRef, { viewCount: FieldValue.increment(1) })
    return true
  })

  return NextResponse.json({ ok: counted })
}
