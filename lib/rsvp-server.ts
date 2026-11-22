export type MealOption = 'korean' | 'western'

export interface RSVPPayload {
  name: string
  side: 'groom' | 'bride'
  attending: boolean
  guestCount: number
  mealAttending: boolean
  mealOption: MealOption | null
  companions: string
  phone: string
}

export function validateRSVPPayload(body: unknown): RSVPPayload | null {
  if (!body || typeof body !== 'object') return null
  const d = body as Record<string, unknown>
  if (typeof d.name !== 'string' || d.name.length === 0 || d.name.length > 50) return null
  if (d.side !== 'groom' && d.side !== 'bride') return null
  if (typeof d.attending !== 'boolean') return null
  if (typeof d.guestCount !== 'number' || !Number.isInteger(d.guestCount) || d.guestCount < 0 || d.guestCount > 50) return null
  if (typeof d.mealAttending !== 'boolean') return null
  if (typeof d.companions !== 'string' || d.companions.length > 200) return null
  if (typeof d.phone !== 'string' || d.phone.length > 30) return null
  // 이 필드가 아직 없던 구버전 클라이언트(배포 전환 중 캐시된 탭 등)의 요청을 굳이
  // 거부하지 않도록, 유효한 값이 아니면 그냥 "선택 안 함"으로 받아들인다.
  const mealOption: MealOption | null = d.mealOption === 'korean' || d.mealOption === 'western' ? d.mealOption : null
  return {
    name: d.name, side: d.side, attending: d.attending, guestCount: d.guestCount,
    mealAttending: d.mealAttending, mealOption, companions: d.companions, phone: d.phone,
  }
}

interface RSVPSettingsLike {
  enabled?: boolean
  deadline?: string
  maxGuests?: number
}

export type RSVPGateResult = { ok: true } | { ok: false; status: number; error: string }

// rsvpSettings가 없는(이 기능 도입 이전에 만들어진) 청첩장은 항상 받던 대로 동작해야
// 하므로, 필드가 없을 때는 비활성화/마감/인원마감 중 아무것도 적용하지 않는다.
// currentGuestTotal은 이번 응답이 반영되기 "전" 기준 인원 합계다 — 새 응답이면 초대장의
// rsvpGuestTotal 그대로, 기존 응답 수정이면 그 응답이 차지하던 인원을 미리 뺀 값을 넘긴다.
export function checkRSVPGate(args: {
  rsvpSettings: RSVPSettingsLike | undefined
  payload: RSVPPayload
  currentGuestTotal: number
}): RSVPGateResult {
  const { rsvpSettings, payload, currentGuestTotal } = args
  if (rsvpSettings?.enabled === false) {
    return { ok: false, status: 403, error: '참석여부 전달이 비활성화되어 있습니다.' }
  }
  if (rsvpSettings?.deadline && new Date() > new Date(`${rsvpSettings.deadline}T23:59:59`)) {
    return { ok: false, status: 403, error: '참석여부 전달이 마감되었습니다.' }
  }
  if (payload.attending && typeof rsvpSettings?.maxGuests === 'number') {
    if (currentGuestTotal + payload.guestCount > rsvpSettings.maxGuests) {
      return { ok: false, status: 409, error: '참석 가능 인원이 모두 마감되었습니다.' }
    }
  }
  return { ok: true }
}
