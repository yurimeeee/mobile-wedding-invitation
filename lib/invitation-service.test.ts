import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteInvitation, loadInvitation, loadUserInvitations } from './invitation-service'

vi.mock('@/lib/firebase', () => ({ db: {}, auth: {}, storage: {} }))
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadString: vi.fn(),
  getDownloadURL: vi.fn(),
}))

const { store, FakeTimestamp } = vi.hoisted(() => {
  class FakeTimestamp {
    constructor(private millis: number) {}
    toDate() {
      return new Date(this.millis)
    }
  }
  return { store: new Map<string, Record<string, unknown>>(), FakeTimestamp }
})

vi.mock('firebase/firestore', () => ({
  Timestamp: FakeTimestamp,
  collection: vi.fn(() => ({})),
  doc: vi.fn((_db, ..._pathAndId: string[]) => ({ id: _pathAndId[_pathAndId.length - 1] })),
  query: vi.fn((c) => c),
  where: vi.fn(),
  serverTimestamp: vi.fn(() => new FakeTimestamp(Date.now())),
  setDoc: vi.fn(),
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
})

describe('loadInvitation', () => {
  it('returns null when the invitation does not exist', async () => {
    expect(await loadInvitation('missing')).toBeNull()
  })

  it('fills in defaults for fields missing from an older saved document', async () => {
    store.set('inv-1', { template: 'dark-luxury', weddingInfo: { groomFirstNameKr: '철수' } })

    const state = await loadInvitation('inv-1')

    expect(state?.template).toBe('dark-luxury')
    expect(state?.weddingInfo.groomFirstNameKr).toBe('철수')
    expect(state?.gallery).toEqual([])
    expect(state?.slug).toBe('')
    expect(state?.introStyle).toBe('fade')
  })
})

describe('loadUserInvitations', () => {
  it('sorts by most recently updated and derives names/thumbnail', async () => {
    store.set('older', {
      uid: 'u1',
      title: '오래된 청첩장',
      updatedAt: new FakeTimestamp(1000),
      weddingInfo: { groomLastNameKr: '김', groomFirstNameKr: '철수', brideLastNameKr: '이', brideFirstNameKr: '영희' },
      gallery: [{ url: 'https://example.com/a.jpg' }],
    })
    store.set('newer', {
      uid: 'u1',
      updatedAt: new FakeTimestamp(2000),
    })

    const list = await loadUserInvitations('u1')

    expect(list.map((i) => i.id)).toEqual(['newer', 'older'])
    expect(list[1].groomName).toBe('김철수')
    expect(list[1].brideName).toBe('이영희')
    expect(list[1].thumbnail).toBe('https://example.com/a.jpg')
    expect(list[0].title).toBe('제목 없음')
    expect(list[0].status).toBe('draft')
  })
})

describe('deleteInvitation', () => {
  it('removes the invitation document', async () => {
    store.set('inv-1', { uid: 'u1' })
    await deleteInvitation('inv-1')
    expect(store.has('inv-1')).toBe(false)
  })
})
