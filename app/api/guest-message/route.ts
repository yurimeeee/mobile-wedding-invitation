import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX = 10

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex')
}

// salt 도입 이전에 저장된 문서는 salt 없이 SHA256(password)로만 해시되어 있었다
function hashPasswordLegacy(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// 방명록 삭제는 비밀번호 대조가 필요한데, Firestore 규칙은 저장된 passwordHash와 클라이언트가
// 보낸 비밀번호를 직접 비교할 수 없다(해시 함수가 없음). 그래서 공개 delete는 막아두고
// (firestore.rules) 여기서 Admin SDK로 비밀번호를 확인한 뒤 대신 삭제해준다.
export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { invitationId, messageId, password } = body as {
    invitationId?: unknown
    messageId?: unknown
    password?: unknown
  }
  if (typeof invitationId !== 'string' || typeof messageId !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'invitationId, messageId, password가 필요합니다.' }, { status: 400 })
  }

  const invitationRef = adminDb.collection('invitations').doc(invitationId)
  const messageRef = invitationRef.collection('messages').doc(messageId)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const ipHash = createHash('sha256').update(ip).digest('hex')
  const rateLimitRef = invitationRef.collection('messageDeleteAttempts').doc(ipHash)

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

  const snap = await messageRef.get()
  if (!snap.exists) {
    return NextResponse.json({ ok: false })
  }

  const data = snap.data()!
  const computedHash = data.salt ? hashPassword(password, data.salt) : hashPasswordLegacy(password)
  if (data.passwordHash !== computedHash) {
    return NextResponse.json({ ok: false })
  }

  await messageRef.delete()
  // 부모 문서를 지워도 서브컬렉션은 남으므로, 비밀글이었다면 private/content도 같이 지운다.
  await messageRef.collection('private').doc('content').delete()
  return NextResponse.json({ ok: true })
}
