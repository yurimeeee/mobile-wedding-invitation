import {
  collection, deleteDoc, doc, getDocs, increment,
  orderBy, query, Timestamp, updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

export type RSVPSide = 'groom' | 'bride'

export interface RSVPResponse {
  id: string
  name: string
  side: RSVPSide
  attending: boolean
  guestCount: number
  mealAttending: boolean
  companions: string
  phone: string
  createdAt: Date
}

function rsvpsCollection(invitationId: string) {
  return collection(db, 'invitations', invitationId, 'rsvps')
}

// 스팸 방지를 위해 IP별 요청 빈도를 제한하는 /api/rsvp 라우트를 통해 저장한다
// (직접 Firestore에 쓰지 않음 — firestore.rules 참고).
export async function submitRSVP(
  invitationId: string,
  data: {
    name: string
    side: RSVPSide
    attending: boolean
    guestCount: number
    mealAttending: boolean
    companions: string
    phone: string
  }
): Promise<void> {
  const res = await fetch('/api/rsvp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invitationId, ...data }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'RSVP 저장에 실패했습니다.')
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
