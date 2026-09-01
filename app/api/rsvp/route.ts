import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { isExpired } from '@/lib/invitation-server'

const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000
const RATE_LIMIT_MAX = 5

interface RSVPPayload {
  name: string
  side: 'groom' | 'bride'
  attending: boolean
  guestCount: number
  mealAttending: boolean
  companions: string
  phone: string
}

function validatePayload(body: unknown): RSVPPayload | null {
  if (!body || typeof body !== 'object') return null
  const d = body as Record<string, unknown>
  if (typeof d.name !== 'string' || d.name.length === 0 || d.name.length > 50) return null
  if (d.side !== 'groom' && d.side !== 'bride') return null
  if (typeof d.attending !== 'boolean') return null
  if (typeof d.guestCount !== 'number' || !Number.isInteger(d.guestCount) || d.guestCount < 0 || d.guestCount > 50) return null
  if (typeof d.mealAttending !== 'boolean') return null
  if (typeof d.companions !== 'string' || d.companions.length > 200) return null
  if (typeof d.phone !== 'string' || d.phone.length > 30) return null
  return {
    name: d.name, side: d.side, attending: d.attending, guestCount: d.guestCount,
    mealAttending: d.mealAttending, companions: d.companions, phone: d.phone,
  }
}

// RSVP는 하객이 로그인 없이 남기는 공개 쓰기라 Firestore 규칙(단일 문서 유효성 검사)만으로는
// 요청 빈도를 제한할 수 없다. 그래서 rsvps의 공개 create는 막아두고(firestore.rules) 이
// 라우트에서 IP당 요청 빈도를 제한한 뒤 Admin SDK로 대신 써준다.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { invitationId, ...rest } = body as { invitationId?: unknown }
  if (!invitationId || typeof invitationId !== 'string') {
    return NextResponse.json({ error: 'invitationId가 필요합니다.' }, { status: 400 })
  }

  const payload = validatePayload(rest)
  if (!payload) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
  }

  const docRef = adminDb.collection('invitations').doc(invitationId)
  const snap = await docRef.get()
  const data = snap.data()
  if (!snap.exists || data?.status !== 'published' || isExpired(data!)) {
    return NextResponse.json({ error: '청첩장을 찾을 수 없습니다.' }, { status: 404 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const ipHash = createHash('sha256').update(ip).digest('hex')
  const rateLimitRef = docRef.collection('rsvpRateLimits').doc(ipHash)

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
    return NextResponse.json({ error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  await docRef.collection('rsvps').add({ ...payload, createdAt: FieldValue.serverTimestamp() })
  if (payload.attending) {
    await docRef.update({
      rsvpAttendingCount: FieldValue.increment(1),
      rsvpGuestTotal: FieldValue.increment(payload.guestCount),
    })
  }
  return NextResponse.json({ ok: true })
}
