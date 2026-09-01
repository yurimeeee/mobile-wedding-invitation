import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteRSVP, loadRSVPs, submitRSVP } from './rsvp-service'

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

vi.mock('firebase/firestore', () => ({
  Timestamp: FakeTimestamp,
  collection: vi.fn(() => ({})),
  doc: vi.fn((_db, ..._pathAndId: string[]) => ({ id: _pathAndId[_pathAndId.length - 1] })),
  query: vi.fn((c) => c),
  orderBy: vi.fn(),
  getDocs: vi.fn(async () => ({
    docs: [...store.entries()].map(([id, data]) => ({ id, data: () => data })),
  })),
  deleteDoc: vi.fn(async (ref: { id: string }) => {
    store.delete(ref.id)
  }),
  increment: vi.fn((n: number) => n),
  updateDoc: vi.fn(async () => {}),
}))

beforeEach(() => {
  store.clear()
})

describe('submitRSVP', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the payload to the /api/rsvp route', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({ ok: true, json: async () => ({ ok: true }) }))
    vi.stubGlobal('fetch', fetchMock)

    await submitRSVP('inv-1', {
      name: '홍길동',
      side: 'groom',
      attending: true,
      guestCount: 2,
      mealAttending: true,
      companions: '김영희',
      phone: '010-1234-5678',
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/rsvp', expect.objectContaining({ method: 'POST' }))
    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({ invitationId: 'inv-1', name: '홍길동', side: 'groom', guestCount: 2 })
  })

  it('throws with the server error message when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({ error: '너무 많은 요청입니다.' }) })))

    await expect(
      submitRSVP('inv-1', {
        name: '홍길동', side: 'groom', attending: true, guestCount: 1,
        mealAttending: false, companions: '', phone: '',
      })
    ).rejects.toThrow('너무 많은 요청입니다.')
  })
})

describe('loadRSVPs', () => {
  it('defaults missing fields and normalizes an unexpected side value to groom', async () => {
    store.set('r1', { name: '홍길동', side: 'bride', attending: false, createdAt: new FakeTimestamp(1000) })
    store.set('r2', { side: 'not-a-real-side' })

    const rsvps = await loadRSVPs('inv-1')
    const full = rsvps.find((r) => r.id === 'r1')!
    const partial = rsvps.find((r) => r.id === 'r2')!

    expect(full.side).toBe('bride')
    expect(full.attending).toBe(false)
    expect(full.createdAt).toEqual(new Date(1000))

    expect(partial.side).toBe('groom')
    expect(partial.name).toBe('')
    expect(partial.attending).toBe(true)
    expect(partial.guestCount).toBe(1)
  })
})

describe('deleteRSVP', () => {
  it('removes the given rsvp', async () => {
    store.set('r1', { name: '홍길동' })
    await deleteRSVP('inv-1', {
      id: 'r1', name: '홍길동', side: 'groom', attending: false, guestCount: 1,
      mealAttending: false, companions: '', phone: '', createdAt: new Date(),
    })
    expect(store.has('r1')).toBe(false)
  })
})
