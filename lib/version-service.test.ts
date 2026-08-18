import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadVersionState, loadVersions, saveVersionSnapshot } from './version-service'
import type { EditorState } from './types'

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
let clock = 0

vi.mock('firebase/firestore', () => ({
  Timestamp: FakeTimestamp,
  collection: vi.fn(() => ({})),
  doc: vi.fn((_db, ..._pathAndId: string[]) => ({ id: _pathAndId[_pathAndId.length - 1] })),
  query: vi.fn((c) => c),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => new FakeTimestamp(clock++)),
  addDoc: vi.fn(async (_col, data: Record<string, unknown>) => {
    const id = `version-${idCounter++}`
    store.set(id, data)
    return { id }
  }),
  getDoc: vi.fn(async (ref: { id: string }) => {
    const data = store.get(ref.id)
    return { exists: () => data !== undefined, data: () => data }
  }),
  getDocs: vi.fn(async () => ({
    // 최신순으로 정렬된 것처럼 반환 — saveVersionSnapshot의 정리 로직이 실제로
    // 최신 MAX_VERSIONS개만 남기는지 검증할 수 있도록 savedAt 내림차순으로 정렬한다.
    docs: [...store.entries()]
      .sort(([, a], [, b]) => (b.savedAt as InstanceType<typeof FakeTimestamp>).toDate().getTime() -
        (a.savedAt as InstanceType<typeof FakeTimestamp>).toDate().getTime())
      .map(([id, data]) => ({ id, data: () => data })),
  })),
  deleteDoc: vi.fn(async (ref: { id: string }) => {
    store.delete(ref.id)
  }),
}))

beforeEach(() => {
  store.clear()
  idCounter = 0
  clock = 0
})

const dummyState = {} as EditorState

describe('saveVersionSnapshot', () => {
  it('stores the given state and label with a timestamp', async () => {
    await saveVersionSnapshot('inv-1', dummyState, 'draft')

    const [saved] = [...store.values()]
    expect(saved.label).toBe('draft')
    expect(saved.savedAt).toBeInstanceOf(FakeTimestamp)
  })

  it('keeps only the most recent MAX_VERSIONS(20) snapshots', async () => {
    for (let i = 0; i < 25; i++) {
      await saveVersionSnapshot('inv-1', dummyState, 'draft')
    }

    expect(store.size).toBe(20)
  })
})

describe('loadVersions', () => {
  it('returns snapshots newest first', async () => {
    await saveVersionSnapshot('inv-1', dummyState, 'draft')
    await saveVersionSnapshot('inv-1', dummyState, 'published')

    const versions = await loadVersions('inv-1')

    expect(versions.map((v) => v.label)).toEqual(['published', 'draft'])
  })
})

describe('loadVersionState', () => {
  it('returns null for a missing version', async () => {
    expect(await loadVersionState('inv-1', 'missing')).toBeNull()
  })

  it('returns the stored state', async () => {
    const state = { template: 'dark-luxury' } as unknown as EditorState
    await saveVersionSnapshot('inv-1', state, 'draft')
    const [id] = [...store.keys()]

    expect(await loadVersionState('inv-1', id)).toEqual(state)
  })
})
