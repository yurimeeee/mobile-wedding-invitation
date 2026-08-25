import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addGuestMessage, deleteGuestMessageWithPassword, loadGuestMessages } from './message-service'

vi.mock('@/lib/firebase', () => ({ db: {} }))

const { store, docStore, FakeTimestamp } = vi.hoisted(() => {
  class FakeTimestamp {
    constructor(private millis: number) {}
    toDate() {
      return new Date(this.millis)
    }
  }
  // store: 방명록 문서(addDoc/getDocs/deleteDoc가 다루는 컬렉션 목록용).
  // docStore: private/content처럼 doc() 경로로 직접 읽고 쓰는 개별 문서용 — 실제 Firestore와
  // 달리 목(mock)의 store는 컬렉션 경로를 구분하지 않으므로, getDocs가 이 문서들까지
  // 방명록 목록에 섞어 반환하지 않도록 별도 맵으로 분리한다.
  return { store: new Map<string, Record<string, unknown>>(), docStore: new Map<string, Record<string, unknown>>(), FakeTimestamp }
})

let idCounter = 0

vi.mock('firebase/firestore', () => ({
  Timestamp: FakeTimestamp,
  collection: vi.fn(() => ({})),
  doc: vi.fn((..._args: unknown[]) => {
    const segments = _args.slice(1) as string[]
    if (segments.length === 0) return { id: `auto-${idCounter++}` }
    return { id: segments.join('/') }
  }),
  query: vi.fn((c) => c),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => new FakeTimestamp(Date.now())),
  addDoc: vi.fn(async (_col, data: Record<string, unknown>) => {
    const id = `msg-${idCounter++}`
    store.set(id, data)
    return { id }
  }),
  setDoc: vi.fn(async (ref: { id: string }, data: Record<string, unknown>) => {
    docStore.set(ref.id, data)
  }),
  getDoc: vi.fn(async (ref: { id: string }) => {
    const data = docStore.get(ref.id)
    return { exists: () => data !== undefined, data: () => data }
  }),
  getDocs: vi.fn(async () => ({
    docs: [...store.entries()].map(([id, data]) => ({ id, data: () => data })),
  })),
  deleteDoc: vi.fn(async (ref: { id: string }) => {
    store.delete(ref.id)
    docStore.delete(ref.id)
  }),
}))

beforeEach(() => {
  store.clear()
  docStore.clear()
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
    expect(full.secret).toBe(false)
    expect(empty.name).toBe('')
    expect(empty.contents).toBe('')
    expect(empty.createdAt).toBeInstanceOf(Date)
  })
})

describe('secret messages', () => {
  it('does not put the real contents on the public message document', async () => {
    await addGuestMessage('inv-1', '홍길동', 'pw', '둘만 아는 이야기', true)

    const [stored] = [...store.values()]
    expect(stored.secret).toBe(true)
    expect(stored.contents).toBe('')
  })

  it('hides secret contents by default and reveals them only when includeSecretContents is true', async () => {
    await addGuestMessage('inv-1', '홍길동', 'pw', '둘만 아는 이야기', true)
    await addGuestMessage('inv-1', '김철수', 'pw', '공개 축하해요', false)

    const publicView = await loadGuestMessages('inv-1')
    const secretInPublic = publicView.find((m) => m.secret)!
    expect(secretInPublic.contents).toBe('')

    const ownerView = await loadGuestMessages('inv-1', true)
    const secretForOwner = ownerView.find((m) => m.secret)!
    const openInPublicAndOwner = ownerView.find((m) => !m.secret)!
    expect(secretForOwner.contents).toBe('둘만 아는 이야기')
    expect(openInPublicAndOwner.contents).toBe('공개 축하해요')
  })
})
