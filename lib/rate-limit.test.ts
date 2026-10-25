import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkRateLimit } from './rate-limit'

const { store } = vi.hoisted(() => ({ store: new Map<string, Record<string, unknown>>() }))

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    runTransaction: async (fn: (tx: unknown) => unknown) => {
      const tx = {
        get: async (ref: { __key: string }) => ({ data: () => store.get(ref.__key) }),
        set: (ref: { __key: string }, data: Record<string, unknown>) => { store.set(ref.__key, data) },
      }
      return fn(tx)
    },
  },
}))

function ref(key: string) {
  return { __key: key } as unknown as import('firebase-admin/firestore').DocumentReference
}

beforeEach(() => {
  store.clear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('checkRateLimit', () => {
  it('allows requests up to the max within the window', async () => {
    const r = ref('a')
    for (let i = 0; i < 3; i++) {
      expect(await checkRateLimit(r, 1000, 3)).toBe(true)
    }
    expect(await checkRateLimit(r, 1000, 3)).toBe(false)
  })

  it('does not double the limit at the fixed-window boundary', async () => {
    const r = ref('a')
    for (let i = 0; i < 3; i++) {
      expect(await checkRateLimit(r, 1000, 3)).toBe(true)
    }
    vi.advanceTimersByTime(900)
    expect(await checkRateLimit(r, 1000, 3)).toBe(false)
  })

  it('allows new requests once the oldest attempts fall outside the window', async () => {
    const r = ref('a')
    for (let i = 0; i < 3; i++) {
      expect(await checkRateLimit(r, 1000, 3)).toBe(true)
    }
    vi.advanceTimersByTime(1001)
    expect(await checkRateLimit(r, 1000, 3)).toBe(true)
  })

  it('tracks separate keys independently', async () => {
    expect(await checkRateLimit(ref('a'), 1000, 1)).toBe(true)
    expect(await checkRateLimit(ref('a'), 1000, 1)).toBe(false)
    expect(await checkRateLimit(ref('b'), 1000, 1)).toBe(true)
  })
})
