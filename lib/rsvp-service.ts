import {
  addDoc, collection, deleteDoc, doc, getDocs,
  orderBy, query, serverTimestamp, Timestamp,
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
  await addDoc(rsvpsCollection(invitationId), {
    ...data,
    createdAt: serverTimestamp(),
  })
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

export async function deleteRSVP(invitationId: string, rsvpId: string): Promise<void> {
  await deleteDoc(doc(db, 'invitations', invitationId, 'rsvps', rsvpId))
}
