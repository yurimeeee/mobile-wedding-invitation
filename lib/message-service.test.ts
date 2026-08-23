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
  vi.unstubAllGlobals()
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

// 비밀번호 대조는 이제 /api/guest-message 라우트(Admin SDK)에서 이루어진다 — 공개 delete가
// Firestore 규칙에서 막혀 있어서 클라이언트가 직접 지울 수 없다. 그래서 여기서는 이 함수가
// 그 라우트를 올바르게 호출하고 응답을 해석하는지만 검증한다.
describe('deleteGuestMessageWithPassword', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  it('calls the server route with the invitation, message id, and password', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })

    const ok = await deleteGuestMessageWithPassword('inv-1', 'msg-1', 'correct-horse')

    expect(ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith('/api/guest-message', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId: 'inv-1', messageId: 'msg-1', password: 'correct-horse' }),
    })
  })

  it('returns false when the server reports the password was wrong', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: false }) })
    expect(await deleteGuestMessageWithPassword('inv-1', 'msg-1', 'wrong')).toBe(false)
  })

  it('returns false when the request fails (e.g. rate limited)', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: '너무 많은 시도' }) })
    expect(await deleteGuestMessageWithPassword('inv-1', 'msg-1', 'whatever')).toBe(false)
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
