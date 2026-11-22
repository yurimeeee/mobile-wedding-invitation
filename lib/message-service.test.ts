import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addGuestMessage, deleteGuestMessageWithPassword, loadGuestMessages } from './message-service'

vi.mock('@/lib/firebase', () => ({ db: {} }))

const { store, docStore, FakeTimestamp } = vi.hoisted(() => {
  class FakeTimestamp {
    constructor(public millis: number) {}
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
  // query/orderBy/limit/startAfter를 실제로 해석해서 getDocs가 커서 기반 페이지네이션을
  // 흉내 내도록 한다 — pageSize+1개를 가져와 hasMore를 판단하는 서비스 쪽 로직을 검증하려면
  // 이 목(mock)이 limit을 무시하지 않고 실제로 잘라내야 한다.
  query: vi.fn((c, ...constraints) => ({ __collection: c, __constraints: constraints })),
  orderBy: vi.fn((field: string, direction?: string) => ({ __type: 'orderBy', field, direction })),
  limit: vi.fn((n: number) => ({ __type: 'limit', n })),
  startAfter: vi.fn((docSnap: { id: string }) => ({ __type: 'startAfter', docSnap })),
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
  getDocs: vi.fn(async (q: { __constraints?: unknown[] } | undefined) => {
    const constraints = q?.__constraints ?? []
    let entries = [...store.entries()].sort((a, b) => {
      const millisOf = (data: Record<string, unknown>) =>
        data.createdAt instanceof FakeTimestamp ? data.createdAt.millis : 0
      return millisOf(b[1]) - millisOf(a[1])
    })

    const startAfterConstraint = constraints.find(
      (c): c is { __type: 'startAfter'; docSnap: { id: string } } =>
        typeof c === 'object' && c !== null && (c as { __type?: string }).__type === 'startAfter'
    )
    if (startAfterConstraint) {
      const idx = entries.findIndex(([id]) => id === startAfterConstraint.docSnap.id)
      entries = idx >= 0 ? entries.slice(idx + 1) : entries
    }

    const limitConstraint = constraints.find(
      (c): c is { __type: 'limit'; n: number } =>
        typeof c === 'object' && c !== null && (c as { __type?: string }).__type === 'limit'
    )
    if (limitConstraint) {
      entries = entries.slice(0, limitConstraint.n)
    }

    return { docs: entries.map(([id, data]) => ({ id, data: () => data })) }
  }),
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
    store.set('m2', { createdAt: new FakeTimestamp(500) })

    const page = await loadGuestMessages('inv-1')
    const full = page.messages.find((m) => m.id === 'm1')!
    const empty = page.messages.find((m) => m.id === 'm2')!

    expect(full.name).toBe('홍길동')
    expect(full.createdAt).toEqual(new Date(1000))
    expect(full.secret).toBe(false)
    expect(empty.name).toBe('')
    expect(empty.contents).toBe('')
    expect(empty.createdAt).toBeInstanceOf(Date)
    expect(page.hasMore).toBe(false)
  })

  it('returns hasMore and a cursor when there are more messages than the page size', async () => {
    for (let i = 0; i < 12; i++) {
      store.set(`m${i}`, { name: `guest-${i}`, contents: 'hi', createdAt: new FakeTimestamp(i) })
    }

    const page = await loadGuestMessages('inv-1', { pageSize: 10 })

    expect(page.messages).toHaveLength(10)
    expect(page.hasMore).toBe(true)
    // 최신순(desc)이므로 첫 페이지는 createdAt이 가장 큰 m11부터 내려온다
    expect(page.messages[0].id).toBe('m11')
    expect(page.cursor).not.toBeNull()
  })

  it('fetches the next page after the given cursor without repeating earlier messages', async () => {
    for (let i = 0; i < 12; i++) {
      store.set(`m${i}`, { name: `guest-${i}`, contents: 'hi', createdAt: new FakeTimestamp(i) })
    }

    const firstPage = await loadGuestMessages('inv-1', { pageSize: 10 })
    const secondPage = await loadGuestMessages('inv-1', { pageSize: 10, cursor: firstPage.cursor })

    expect(secondPage.messages).toHaveLength(2)
    expect(secondPage.hasMore).toBe(false)
    const firstPageIds = firstPage.messages.map((m) => m.id)
    expect(secondPage.messages.some((m) => firstPageIds.includes(m.id))).toBe(false)
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
    const secretInPublic = publicView.messages.find((m) => m.secret)!
    expect(secretInPublic.contents).toBe('')

    const ownerView = await loadGuestMessages('inv-1', { includeSecretContents: true })
    const secretForOwner = ownerView.messages.find((m) => m.secret)!
    const openInPublicAndOwner = ownerView.messages.find((m) => !m.secret)!
    expect(secretForOwner.contents).toBe('둘만 아는 이야기')
    expect(openInPublicAndOwner.contents).toBe('공개 축하해요')
  })
})
