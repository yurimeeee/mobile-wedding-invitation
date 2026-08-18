import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addGuestMessage, deleteGuestMessageWithPassword, loadGuestMessages } from './message-service'

vi.mock('@/lib/firebase', () => ({ db: {} }))

const { store, FakeTimestamp } = vi.hoisted(() => {
  class FakeTimestamp {
    constructor(private millis: number) {}
    toDate() {
      return new Date(this.millis)
    }
  }
  return { store: new Map<string, Record<string, unknown>>(), FakeTimestamp }
})

let idCounter = 0

vi.mock('firebase/firestore', () => ({
  Timestamp: FakeTimestamp,
  collection: vi.fn(() => ({})),
  doc: vi.fn((_db, ..._pathAndId: string[]) => ({ id: _pathAndId[_pathAndId.length - 1] })),
  query: vi.fn((c) => c),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => new FakeTimestamp(Date.now())),
  addDoc: vi.fn(async (_col, data: Record<string, unknown>) => {
    const id = `msg-${idCounter++}`
    store.set(id, data)
    return { id }
  }),
  getDoc: vi.fn(async (ref: { id: string }) => {
    const data = store.get(ref.id)
    return { exists: () => data !== undefined, data: () => data }
  }),
  getDocs: vi.fn(async () => ({
    docs: [...store.entries()].map(([id, data]) => ({ id, data: () => data })),
  })),
  deleteDoc: vi.fn(async (ref: { id: string }) => {
    store.delete(ref.id)
  }),
}))

beforeEach(() => {
  store.clear()
  idCounter = 0
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('addGuestMessage', () => {
  it('stores a random salt so identical passwords hash differently across messages', async () => {
    await addGuestMessage('inv-1', '홍길동', 'sameSecret', '축하합니다')
    await addGuestMessage('inv-1', '김철수', 'sameSecret', '행복하세요')

    const [a, b] = [...store.values()]
    expect(a.salt).not.toEqual(b.salt)
    expect(a.passwordHash).not.toEqual(b.passwordHash)
  })
})

describe('deleteGuestMessageWithPassword', () => {
  it('deletes when the correct password is given', async () => {
    const created = await addGuestMessage('inv-1', '홍길동', 'correct-horse', '축하합니다')
    const ok = await deleteGuestMessageWithPassword('inv-1', created.id, 'correct-horse')
    expect(ok).toBe(true)
    expect(store.has(created.id)).toBe(false)
  })

  it('refuses deletion and keeps the message when the password is wrong', async () => {
    const created = await addGuestMessage('inv-1', '홍길동', 'correct-horse', '축하합니다')
    const ok = await deleteGuestMessageWithPassword('inv-1', created.id, 'wrong-password')
    expect(ok).toBe(false)
    expect(store.has(created.id)).toBe(true)
  })

  it('still verifies legacy unsalted documents written before salting was added', async () => {
    // salt 도입 이전 문서 형태를 그대로 재현: SHA256(password)만 저장되어 있고 salt 필드가 없음
    const legacyHash = await crypto.subtle
      .digest('SHA-256', new TextEncoder().encode('legacy-pass'))
      .then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join(''))
    store.set('legacy-1', { name: '레거시', contents: '오래된 메시지', passwordHash: legacyHash })

    const ok = await deleteGuestMessageWithPassword('inv-1', 'legacy-1', 'legacy-pass')
    expect(ok).toBe(true)
  })

  it('returns false for a message that does not exist', async () => {
    const ok = await deleteGuestMessageWithPassword('inv-1', 'does-not-exist', 'whatever')
    expect(ok).toBe(false)
  })
})

describe('loadGuestMessages', () => {
  it('defaults missing fields and converts Firestore Timestamps to Date', async () => {
    store.set('m1', { name: '홍길동', contents: '축하해요', createdAt: new FakeTimestamp(1000) })
    store.set('m2', {})

    const messages = await loadGuestMessages('inv-1')
    const full = messages.find((m) => m.id === 'm1')!
    const empty = messages.find((m) => m.id === 'm2')!

    expect(full.name).toBe('홍길동')
    expect(full.createdAt).toEqual(new Date(1000))
    expect(empty.name).toBe('')
    expect(empty.contents).toBe('')
    expect(empty.createdAt).toBeInstanceOf(Date)
  })
})
