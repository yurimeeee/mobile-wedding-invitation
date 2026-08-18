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

function randomSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`)
}

// salt 도입 이전에 저장된 문서는 salt 없이 SHA256(password)로만 해시되어 있었다
function hashPasswordLegacy(password: string): Promise<string> {
  return sha256Hex(password)
}

function messagesCollection(invitationId: string) {
  return collection(db, 'invitations', invitationId, 'messages')
}

export async function addGuestMessage(
  invitationId: string,
  name: string,
  password: string,
  contents: string
): Promise<GuestMessage> {
  const salt = randomSalt()
  const passwordHash = await hashPassword(password, salt)
  const docRef = await addDoc(messagesCollection(invitationId), {
    name,
    passwordHash,
    salt,
    contents,
    createdAt: serverTimestamp(),
  })
  return { id: docRef.id, name, contents, createdAt: new Date() }
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

  const stored = snap.data()
  const passwordHash = stored.salt
    ? await hashPassword(password, stored.salt)
    : await hashPasswordLegacy(password)
  if (stored.passwordHash !== passwordHash) return false

  await deleteDoc(msgRef)
  return true
}

export async function deleteGuestMessage(invitationId: string, messageId: string): Promise<void> {
  await deleteDoc(doc(db, 'invitations', invitationId, 'messages', messageId))
}
