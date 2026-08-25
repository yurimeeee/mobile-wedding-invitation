import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setDoc } from 'firebase/firestore'
import { deleteInvitation, loadInvitation, loadUserInvitations, saveInvitation } from './invitation-service'
import {
  AUTO_EXPIRE_DAYS,
  defaultCalendarSettings, defaultCustomLayout, defaultMusicSettings,
  defaultPrivacySettings, defaultShareSettings, defaultWeddingInfo, defaultStoryItems,
  type EditorState,
} from './types'

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
    static fromDate(date: Date) {
      return new FakeTimestamp(date.getTime())
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
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => new FakeTimestamp(Date.now())),
  setDoc: vi.fn(),
  addDoc: vi.fn(async () => ({ id: 'version-1' })),
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
  vi.mocked(setDoc).mockClear()
})

function makeState(overrides: { weddingDate?: string; autoExpireEnabled?: boolean } = {}): EditorState {
  return {
    template: 'classic-elegant',
    weddingInfo: { ...defaultWeddingInfo, weddingDate: overrides.weddingDate ?? '' },
    musicSettings: defaultMusicSettings,
    gallery: [],
    storyItems: defaultStoryItems,
    calendarSettings: defaultCalendarSettings,
    shareSettings: defaultShareSettings,
    privacySettings: { ...defaultPrivacySettings, autoExpireEnabled: overrides.autoExpireEnabled ?? false },
    slug: '',
    mode: 'template',
    customLayout: defaultCustomLayout,
    introStyle: 'fade',
  }
}

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

describe('saveInvitation', () => {
  it('sets expiresAt to weddingDate + AUTO_EXPIRE_DAYS when auto-expire is enabled', async () => {
    const state = makeState({ weddingDate: '2026-01-01', autoExpireEnabled: true })
    await saveInvitation('u1', 'inv-1', state, 'published')

    const expected = new Date('2026-01-01')
    expected.setDate(expected.getDate() + AUTO_EXPIRE_DAYS)

    const [, payload] = vi.mocked(setDoc).mock.calls[0]
    const expiresAt = (payload as { expiresAt: InstanceType<typeof FakeTimestamp> | null }).expiresAt
    expect(expiresAt).toBeInstanceOf(FakeTimestamp)
    expect(expiresAt!.toDate().getTime()).toBe(expected.getTime())
  })

  it('leaves expiresAt null when auto-expire is disabled', async () => {
    const state = makeState({ weddingDate: '2026-01-01', autoExpireEnabled: false })
    await saveInvitation('u1', 'inv-1', state, 'draft')

    const [, payload] = vi.mocked(setDoc).mock.calls[0]
    expect((payload as { expiresAt: unknown }).expiresAt).toBeNull()
  })

  it('leaves expiresAt null when enabled but no wedding date is set', async () => {
    const state = makeState({ autoExpireEnabled: true })
    await saveInvitation('u1', 'inv-1', state, 'draft')

    const [, payload] = vi.mocked(setDoc).mock.calls[0]
    expect((payload as { expiresAt: unknown }).expiresAt).toBeNull()
  })
})

describe('deleteInvitation', () => {
  it('removes the invitation document', async () => {
    store.set('inv-1', { uid: 'u1' })
    await deleteInvitation('inv-1')
    expect(store.has('inv-1')).toBe(false)
  })
})
