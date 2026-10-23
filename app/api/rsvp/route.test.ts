import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import { POST } from './route'

const { invitations, rateLimits, rsvps } = vi.hoisted(() => ({
  invitations: new Map<string, Record<string, unknown>>(),
  rateLimits: new Map<string, Record<string, unknown>>(),
  rsvps: [] as Record<string, unknown>[],
}))

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => {
      if (name !== 'invitations') throw new Error(`unexpected collection: ${name}`)
      return {
        doc: (id: string) => ({
          get: async () => ({ exists: invitations.has(id), data: () => invitations.get(id) }),
          update: vi.fn(),
          collection: (sub: string) => {
            if (sub === 'rsvpRateLimits') return { doc: (ipHash: string) => ({ __key: `${id}/${ipHash}` }) }
            if (sub === 'rsvps') return { add: async (data: Record<string, unknown>) => { rsvps.push(data) } }
            throw new Error(`unexpected subcollection: ${sub}`)
          },
        }),
      }
    },
    runTransaction: async (fn: (tx: unknown) => unknown) => {
      const tx = {
        get: async (ref: { __key: string }) => ({ data: () => rateLimits.get(ref.__key) }),
        update: (ref: { __key: string }, data: Record<string, unknown>) => {
          const existing = rateLimits.get(ref.__key) ?? {}
          rateLimits.set(ref.__key, { ...existing, ...data, count: ((existing.count as number) ?? 0) + 1 })
        },
        set: (ref: { __key: string }, data: Record<string, unknown>) => {
          rateLimits.set(ref.__key, { ...data, windowStart: Timestamp.fromMillis(Date.now()) })
        },
      }
      return fn(tx)
    },
  },
}))

const validPayload = {
  name: '홍길동', side: 'groom' as const, attending: true, guestCount: 2,
  mealAttending: true, companions: '김영희', phone: '010-1234-5678',
}

function postRequest(body: unknown) {
  return POST(new NextRequest('http://localhost/api/rsvp', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }))
}

beforeEach(() => {
  invitations.clear()
  rateLimits.clear()
  rsvps.length = 0
  invitations.set('inv-1', { status: 'published' })
})

describe('POST /api/rsvp', () => {
  it('rejects a missing invitationId', async () => {
    const res = await postRequest({ ...validPayload })
    expect(res.status).toBe(400)
  })

  it('rejects an invalid payload', async () => {
    const res = await postRequest({ invitationId: 'inv-1', ...validPayload, guestCount: -1 })
    expect(res.status).toBe(400)
    expect(rsvps).toHaveLength(0)
  })

  it('returns 404 for an invitation that is not published', async () => {
    invitations.set('inv-1', { status: 'draft' })
    const res = await postRequest({ invitationId: 'inv-1', ...validPayload })
    expect(res.status).toBe(404)
  })

  it('returns 404 for an expired invitation', async () => {
    invitations.set('inv-1', { status: 'published', expiresAt: Timestamp.fromMillis(Date.now() - 1000) })
    const res = await postRequest({ invitationId: 'inv-1', ...validPayload })
    expect(res.status).toBe(404)
  })

  it('stores a valid RSVP', async () => {
    const res = await postRequest({ invitationId: 'inv-1', ...validPayload })
    expect(res.status).toBe(200)
    expect(rsvps).toHaveLength(1)
    expect(rsvps[0]).toMatchObject({ name: '홍길동', side: 'groom', guestCount: 2 })
  })

  it('rate limits after too many submissions within the window', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await postRequest({ invitationId: 'inv-1', ...validPayload })
      expect(res.status).toBe(200)
    }
    const res = await postRequest({ invitationId: 'inv-1', ...validPayload })
    expect(res.status).toBe(429)
    expect(rsvps).toHaveLength(5)
  })
})
