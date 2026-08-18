import { beforeEach, describe, expect, it, vi } from 'vitest'
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

let idCounter = 0

vi.mock('firebase/firestore', () => ({
  Timestamp: FakeTimestamp,
  collection: vi.fn(() => ({})),
  doc: vi.fn((_db, ..._pathAndId: string[]) => ({ id: _pathAndId[_pathAndId.length - 1] })),
  query: vi.fn((c) => c),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => new FakeTimestamp(Date.now())),
  addDoc: vi.fn(async (_col, data: Record<string, unknown>) => {
    const id = `rsvp-${idCounter++}`
    store.set(id, data)
    return { id }
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

describe('submitRSVP', () => {
  it('stores exactly the fields it was given plus a server timestamp', async () => {
    await submitRSVP('inv-1', {
      name: '홍길동',
      side: 'groom',
      attending: true,
      guestCount: 2,
      mealAttending: true,
      companions: '김영희',
      phone: '010-1234-5678',
    })

    const [saved] = [...store.values()]
    expect(saved).toMatchObject({
      name: '홍길동',
      side: 'groom',
      attending: true,
      guestCount: 2,
    })
    expect(saved.createdAt).toBeInstanceOf(FakeTimestamp)
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
    await deleteRSVP('inv-1', 'r1')
    expect(store.has('r1')).toBe(false)
  })
})
