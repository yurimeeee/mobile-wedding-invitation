import {
  addDoc, collection, deleteDoc, doc, getDocs,
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

// 비밀번호 대조와 삭제는 서버(/api/guest-message)에서만 이루어진다 — Firestore 규칙은
// 공개 delete를 막아뒀다(누구나 devtools로 Firestore를 직접 호출해 비밀번호 없이 삭제하는
// 것을 막기 위해). 여기서는 결과만 돌려받는다.
export async function deleteGuestMessageWithPassword(
  invitationId: string,
  messageId: string,
  password: string
): Promise<boolean> {
  const res = await fetch('/api/guest-message', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invitationId, messageId, password }),
  })
  const data = await res.json().catch(() => ({}))
  return res.ok && data.ok === true
}

export async function deleteGuestMessage(invitationId: string, messageId: string): Promise<void> {
  await deleteDoc(doc(db, 'invitations', invitationId, 'messages', messageId))
}
