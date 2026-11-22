import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit,
  orderBy, query, serverTimestamp, setDoc, startAfter, Timestamp,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import { hashPassword, randomSalt } from './password-hash'

export interface GuestMessage {
  id: string
  name: string
  contents: string
  secret: boolean
  createdAt: Date
}

export type GuestMessageCursor = QueryDocumentSnapshot

export interface GuestMessagesPage {
  messages: GuestMessage[]
  cursor: GuestMessageCursor | null
  hasMore: boolean
}

const MESSAGES_PAGE_SIZE = 10

function messagesCollection(invitationId: string) {
  return collection(db, 'invitations', invitationId, 'messages')
}

// 비밀글은 방명록 문서 자체에는 내용을 담지 않는다 — 발행된 청첩장의 messages 문서는
// 누구나 읽을 수 있어서(firestore.rules), contents를 그대로 두면 devtools로 그대로
// 노출된다. 실제 내용은 소유자만 읽을 수 있는 private/content 서브문서에 따로 저장한다.
export async function addGuestMessage(
  invitationId: string,
  name: string,
  password: string,
  contents: string,
  secret: boolean = false
): Promise<GuestMessage> {
  const salt = randomSalt()
  const passwordHash = await hashPassword(password, salt)
  const docRef = await addDoc(messagesCollection(invitationId), {
    name,
    passwordHash,
    salt,
    contents: secret ? '' : contents,
    secret,
    createdAt: serverTimestamp(),
  })
  if (secret) {
    await setDoc(doc(db, 'invitations', invitationId, 'messages', docRef.id, 'private', 'content'), { contents })
  }
  return { id: docRef.id, name, contents: secret ? '' : contents, secret, createdAt: new Date() }
}

// includeSecretContents는 소유자 전용 화면(대시보드)에서만 true로 넘긴다 — 비밀글의 실제
// 내용을 private 서브문서에서 함께 불러온다. 공개 방명록(하객 화면)에서는 항상 기본값(false)으로
// 불러와서 비밀글 내용이 클라이언트에 노출되지 않게 한다.
//
// 메시지가 많이 쌓인 청첩장에서 매번 전체를 한 번에 불러오면 로딩이 느려지므로, 커서
// 기반으로 한 번에 pageSize개만 가져온다. cursor는 이전 호출이 돌려준 마지막 문서
// 스냅샷을 그대로 넘기면 된다(첫 페이지는 생략).
export async function loadGuestMessages(
  invitationId: string,
  options: { includeSecretContents?: boolean; cursor?: GuestMessageCursor | null; pageSize?: number } = {}
): Promise<GuestMessagesPage> {
  const { includeSecretContents = false, cursor = null, pageSize = MESSAGES_PAGE_SIZE } = options
  const constraints = [orderBy('createdAt', 'desc'), limit(pageSize + 1)]
  const q = cursor
    ? query(messagesCollection(invitationId), ...constraints, startAfter(cursor))
    : query(messagesCollection(invitationId), ...constraints)
  const snapshot = await getDocs(q)
  const hasMore = snapshot.docs.length > pageSize
  const pageDocs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs

  const messages = pageDocs.map((docSnap) => {
    const d = docSnap.data()
    return {
      id: docSnap.id,
      name: d.name ?? '',
      contents: d.contents ?? '',
      secret: d.secret === true,
      createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(),
    }
  })

  const nextCursor = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : cursor

  if (!includeSecretContents) {
    return { messages, cursor: nextCursor, hasMore }
  }

  const withSecrets = await Promise.all(
    messages.map(async (m) => {
      if (!m.secret) return m
      const snap = await getDoc(doc(db, 'invitations', invitationId, 'messages', m.id, 'private', 'content'))
      return { ...m, contents: (snap.data()?.contents as string | undefined) ?? '' }
    })
  )
  return { messages: withSecrets, cursor: nextCursor, hasMore }
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
  // 부모 문서를 지워도 서브컬렉션은 남으므로, 비밀글이었다면 private/content도 같이 지운다.
  await deleteDoc(doc(db, 'invitations', invitationId, 'messages', messageId, 'private', 'content'))
}
