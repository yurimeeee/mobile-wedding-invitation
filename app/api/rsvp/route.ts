import { NextResponse, type NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { isExpired } from '@/lib/invitation-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'
import { checkRSVPGate, validateRSVPPayload } from '@/lib/rsvp-server'

const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000
const RATE_LIMIT_MAX = 5

// RSVP는 하객이 로그인 없이 남기는 공개 쓰기라 Firestore 규칙(단일 문서 유효성 검사)만으로는
// 요청 빈도를 제한할 수 없다. 그래서 rsvps의 공개 create는 막아두고(firestore.rules) 이
// 라우트에서 IP당 요청 빈도를 제한한 뒤 Admin SDK로 대신 써준다.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { invitationId, ...rest } = body as { invitationId?: unknown }
  if (!invitationId || typeof invitationId !== 'string') {
    return NextResponse.json({ error: 'invitationId가 필요합니다.' }, { status: 400 })
  }

  const payload = validateRSVPPayload(rest)
  if (!payload) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
  }

  const docRef = adminDb.collection('invitations').doc(invitationId)
  const snap = await docRef.get()
  const data = snap.data()
  if (!snap.exists || data?.status !== 'published' || isExpired(data!)) {
    return NextResponse.json({ error: '청첩장을 찾을 수 없습니다.' }, { status: 404 })
  }

  const gate = checkRSVPGate({
    rsvpSettings: data.rsvpSettings,
    payload,
    currentGuestTotal: typeof data.rsvpGuestTotal === 'number' ? data.rsvpGuestTotal : 0,
  })
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const ip = getClientIp(request)
  const ipHash = createHash('sha256').update(ip).digest('hex')
  const rateLimitRef = docRef.collection('rsvpRateLimits').doc(ipHash)
  const allowed = await checkRateLimit(rateLimitRef, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)

  if (!allowed) {
    return NextResponse.json({ error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  // 새로고침 후 폼이 다시 비어 보여서 같은 하객이 모르고 중복 제출하는 걸 막기 위해,
  // 응답마다 수정 전용 토큰을 발급해 클라이언트(이 기기)에만 저장해둔다. 이 토큰을
  // 아는 요청만 /api/rsvp/[rsvpId]로 같은 응답을 고쳐 쓸 수 있다.
  const editToken = randomBytes(16).toString('hex')
  const rsvpRef = await docRef.collection('rsvps').add({ ...payload, editToken, createdAt: FieldValue.serverTimestamp() })
  if (payload.attending) {
    await docRef.update({
      rsvpAttendingCount: FieldValue.increment(1),
      rsvpGuestTotal: FieldValue.increment(payload.guestCount),
    })
  }
  return NextResponse.json({ ok: true, rsvpId: rsvpRef.id, editToken })
}
