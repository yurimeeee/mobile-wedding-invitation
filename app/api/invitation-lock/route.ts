import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { isExpired } from '@/lib/invitation-server'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX = 10

// 청첩장 잠금 비밀번호는 invitations/{id}/private/lock 서브문서에만 있고 그 문서는
// 소유자만 읽을 수 있다(firestore.rules). 하객의 잠금 해제 확인은 여기서 Admin SDK로
// 비밀번호를 대조한 뒤 맞았는지 여부만 돌려주고, 평문 비밀번호는 클라이언트로 절대 보내지 않는다.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { id, password } = body as { id?: unknown; password?: unknown }
  if (!id || typeof id !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'id와 password가 필요합니다.' }, { status: 400 })
  }

  const bySlug = await adminDb.collection('invitations').where('slug', '==', id).limit(1).get()
  const docRef = !bySlug.empty ? bySlug.docs[0].ref : adminDb.collection('invitations').doc(id)
  const snap = await docRef.get()
  const data = snap.data()
  if (!snap.exists || data?.status !== 'published' || isExpired(data!)) {
    return NextResponse.json({ error: '청첩장을 찾을 수 없습니다.' }, { status: 404 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const ipHash = createHash('sha256').update(ip).digest('hex')
  const rateLimitRef = docRef.collection('lockAttempts').doc(ipHash)

  const allowed = await adminDb.runTransaction(async (tx) => {
    const rlSnap = await tx.get(rateLimitRef)
    const rl = rlSnap.data()
    const windowStart = rl?.windowStart instanceof Timestamp ? rl.windowStart.toMillis() : 0
    const withinWindow = Date.now() - windowStart < RATE_LIMIT_WINDOW_MS

    if (withinWindow) {
      if ((rl?.count ?? 0) >= RATE_LIMIT_MAX) return false
      tx.update(rateLimitRef, { count: FieldValue.increment(1) })
    } else {
      tx.set(rateLimitRef, { windowStart: FieldValue.serverTimestamp(), count: 1 })
    }
    return true
  })

  if (!allowed) {
    return NextResponse.json({ error: '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  if (!data?.privacySettings?.lockEnabled) {
    return NextResponse.json({ ok: false })
  }

  const lockSnap = await docRef.collection('private').doc('lock').get()
  const correctPassword = lockSnap.data()?.password ?? ''
  const ok = correctPassword.length > 0 && password === correctPassword

  return NextResponse.json({ ok })
}
