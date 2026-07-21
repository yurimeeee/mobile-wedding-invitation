import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs,
  orderBy, query, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export interface GuestMessage {
  id: string
  name: string
  contents: string
  createdAt: Date
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function messagesCollection(invitationId: string) {
  return collection(db, 'invitations', invitationId, 'messages')
}

export async function addGuestMessage(
  invitationId: string,
  name: string,
  password: string,
  contents: string
): Promise<void> {
  const passwordHash = await hashPassword(password)
  await addDoc(messagesCollection(invitationId), {
    name,
    passwordHash,
    contents,
    createdAt: serverTimestamp(),
  })
}

export async function loadGuestMessages(invitationId: string): Promise<GuestMessage[]> {
  const q = query(messagesCollection(invitationId), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => {
    const d = docSnap.data()
    return {
      id: docSnap.id,
      name: d.name ?? '',
      contents: d.contents ?? '',
      createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    }
  })
}

export async function deleteGuestMessageWithPassword(
  invitationId: string,
  messageId: string,
  password: string
): Promise<boolean> {
  const msgRef = doc(db, 'invitations', invitationId, 'messages', messageId)
  const snap = await getDoc(msgRef)
  if (!snap.exists()) return false

  const passwordHash = await hashPassword(password)
  if (snap.data().passwordHash !== passwordHash) return false

  await deleteDoc(msgRef)
  return true
}

export async function deleteGuestMessage(invitationId: string, messageId: string): Promise<void> {
  await deleteDoc(doc(db, 'invitations', invitationId, 'messages', messageId))
}
