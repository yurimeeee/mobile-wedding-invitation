import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { isExpired } from '@/lib/invitation-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'
import { timingSafeEqualStrings } from '@/lib/timing-safe-equal'
import { checkRSVPGate, validateRSVPPayload } from '@/lib/rsvp-server'

const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000
const RATE_LIMIT_MAX = 5

class RSVPEditError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// 하객이 이전에 전달한 참석여부를 고쳐 쓰는 라우트. POST /api/rsvp가 응답을 만들 때 발급한
// editToken을 아는 요청만 그 응답을 수정할 수 있다 — 새 응답을 또 만드는 게 아니라 같은
// 문서를 갱신하므로 참석 인원 집계(rsvpAttendingCount/rsvpGuestTotal)가 중복되지 않는다.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ rsvpId: string }> }) {
  const { rsvpId } = await params
  const body = await request.json().catch(() => ({}))
  const { invitationId, editToken, ...rest } = body as { invitationId?: unknown; editToken?: unknown }
  if (!invitationId || typeof invitationId !== 'string' || !editToken || typeof editToken !== 'string') {
    return NextResponse.json({ error: 'invitationId와 editToken이 필요합니다.' }, { status: 400 })
  }

  const payload = validateRSVPPayload(rest)
  if (!payload) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
  }

  const invitationRef = adminDb.collection('invitations').doc(invitationId)
  const invitationSnap = await invitationRef.get()
  const invitationData = invitationSnap.data()
  if (!invitationSnap.exists || invitationData?.status !== 'published' || isExpired(invitationData!)) {
    return NextResponse.json({ error: '청첩장을 찾을 수 없습니다.' }, { status: 404 })
  }

  const ip = getClientIp(request)
  const ipHash = createHash('sha256').update(ip).digest('hex')
  const rateLimitRef = invitationRef.collection('rsvpRateLimits').doc(ipHash)
  const allowed = await checkRateLimit(rateLimitRef, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)
  if (!allowed) {
    return NextResponse.json({ error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const rsvpRef = invitationRef.collection('rsvps').doc(rsvpId)

  try {
    await adminDb.runTransaction(async (tx) => {
      const [rsvpSnap, freshInvitationSnap] = await Promise.all([tx.get(rsvpRef), tx.get(invitationRef)])
      if (!rsvpSnap.exists) {
        throw new RSVPEditError(404, '응답을 찾을 수 없습니다.')
      }
      const rsvpData = rsvpSnap.data()!
      const storedToken = typeof rsvpData.editToken === 'string' ? rsvpData.editToken : ''
      if (!storedToken || !timingSafeEqualStrings(editToken, storedToken)) {
        throw new RSVPEditError(403, '수정 권한이 없습니다.')
      }

      const oldGuestContribution = rsvpData.attending ? ((rsvpData.guestCount as number) ?? 0) : 0
      const newGuestContribution = payload.attending ? payload.guestCount : 0
      const freshInvitationData = freshInvitationSnap.data()!
      const currentTotal = typeof freshInvitationData.rsvpGuestTotal === 'number' ? freshInvitationData.rsvpGuestTotal : 0

      const gate = checkRSVPGate({
        rsvpSettings: freshInvitationData.rsvpSettings,
        payload,
        currentGuestTotal: currentTotal - oldGuestContribution,
      })
      if (!gate.ok) {
        throw new RSVPEditError(gate.status, gate.error)
      }

      tx.update(rsvpRef, { ...payload, editToken: storedToken, updatedAt: FieldValue.serverTimestamp() })
      tx.update(invitationRef, {
        rsvpAttendingCount: FieldValue.increment((payload.attending ? 1 : 0) - (rsvpData.attending ? 1 : 0)),
        rsvpGuestTotal: FieldValue.increment(newGuestContribution - oldGuestContribution),
      })
    })
  } catch (err) {
    if (err instanceof RSVPEditError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }

  return NextResponse.json({ ok: true })
}
