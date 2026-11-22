import {
  collection, deleteDoc, doc, getDocs, increment,
  orderBy, query, Timestamp, updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { MealOption } from './rsvp-server'

export type RSVPSide = 'groom' | 'bride'
export type { MealOption }

export interface RSVPResponse {
  id: string
  name: string
  side: RSVPSide
  attending: boolean
  guestCount: number
  mealAttending: boolean
  mealOption: MealOption | null
  companions: string
  phone: string
  createdAt: Date
}

function rsvpsCollection(invitationId: string) {
  return collection(db, 'invitations', invitationId, 'rsvps')
}

export interface RSVPFormData {
  name: string
  side: RSVPSide
  attending: boolean
  guestCount: number
  mealAttending: boolean
  mealOption: MealOption | null
  companions: string
  phone: string
}

export interface SubmitRSVPResult {
  rsvpId: string
  editToken: string
}

// 스팸 방지를 위해 IP별 요청 빈도를 제한하는 /api/rsvp 라우트를 통해 저장한다
// (직접 Firestore에 쓰지 않음 — firestore.rules 참고). 응답마다 서버가 발급하는
// editToken은 이 기기에 저장해두고 updateRSVP로 같은 응답을 고쳐 쓸 때 쓴다.
export async function submitRSVP(invitationId: string, data: RSVPFormData): Promise<SubmitRSVPResult> {
  const res = await fetch('/api/rsvp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invitationId, ...data }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || 'RSVP 저장에 실패했습니다.')
  }
  return { rsvpId: body.rsvpId, editToken: body.editToken }
}

export async function updateRSVP(
  invitationId: string,
  rsvpId: string,
  editToken: string,
  data: RSVPFormData
): Promise<void> {
  const res = await fetch(`/api/rsvp/${rsvpId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invitationId, editToken, ...data }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'RSVP 수정에 실패했습니다.')
  }
}

export async function loadRSVPs(invitationId: string): Promise<RSVPResponse[]> {
  const q = query(rsvpsCollection(invitationId), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => {
    const d = docSnap.data()
    return {
      id: docSnap.id,
      name: d.name ?? '',
      side: (d.side === 'bride' ? 'bride' : 'groom') as RSVPSide,
      attending: d.attending ?? true,
      guestCount: d.guestCount ?? 1,
      mealAttending: d.mealAttending ?? false,
      mealOption: d.mealOption === 'korean' || d.mealOption === 'western' ? d.mealOption : null,
      companions: d.companions ?? '',
      phone: d.phone ?? '',
      createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    }
  })
}

// /api/rsvp에서 참석 응답을 더할 때 대시보드용 집계(rsvpAttendingCount/rsvpGuestTotal)를
// 초대장 문서에 같이 늘려두므로, 삭제할 때도 같은 응답의 참석 여부·인원만큼 되돌려준다.
export async function deleteRSVP(invitationId: string, rsvp: RSVPResponse): Promise<void> {
  await deleteDoc(doc(db, 'invitations', invitationId, 'rsvps', rsvp.id))
  if (rsvp.attending) {
    await updateDoc(doc(db, 'invitations', invitationId), {
      rsvpAttendingCount: increment(-1),
      rsvpGuestTotal: increment(-rsvp.guestCount),
    })
  }
}
