import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import { PUT } from './route'

const { invitations, rsvps, rateLimits } = vi.hoisted(() => ({
  invitations: new Map<string, Record<string, unknown>>(),
  rsvps: new Map<string, Record<string, unknown>>(),
  rateLimits: new Map<string, Record<string, unknown>>(),
}))

interface InvitationRef { __invId: string }
interface RsvpRef { __invId: string; __rsvpId: string }
interface RateLimitRef { __key: string }
type TxRef = InvitationRef | RsvpRef | RateLimitRef

function rsvpKey(ref: RsvpRef) {
  return `${ref.__invId}/${ref.__rsvpId}`
}

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => {
      if (name !== 'invitations') throw new Error(`unexpected collection: ${name}`)
      return {
        doc: (invId: string) => ({
          __invId: invId,
          get: async () => ({ exists: invitations.has(invId), data: () => invitations.get(invId) }),
          collection: (sub: string) => {
            if (sub === 'rsvpRateLimits') return { doc: (ipHash: string) => ({ __key: `${invId}/${ipHash}` }) }
            if (sub === 'rsvps') return { doc: (rsvpId: string) => ({ __invId: invId, __rsvpId: rsvpId }) }
            throw new Error(`unexpected subcollection: ${sub}`)
          },
        }),
      }
    },
    runTransaction: async (fn: (tx: unknown) => unknown) => {
      const tx = {
        get: async (ref: TxRef) => {
          if ('__rsvpId' in ref) {
            const key = rsvpKey(ref)
            return { exists: rsvps.has(key), data: () => rsvps.get(key) }
          }
          if ('__invId' in ref) {
            return { data: () => invitations.get(ref.__invId) }
          }
          return { data: () => rateLimits.get((ref as RateLimitRef).__key) }
        },
        update: (ref: TxRef, data: Record<string, unknown>) => {
          if ('__rsvpId' in ref) {
            const key = rsvpKey(ref)
            rsvps.set(key, { ...rsvps.get(key), ...data })
          }
          // invitation aggregate (rsvpAttendingCount/rsvpGuestTotal) increments aren't
          // simulated here — these tests only check the rsvp document and status codes.
        },
        set: (ref: TxRef, data: Record<string, unknown>) => {
          if ('__key' in ref) rateLimits.set(ref.__key, { ...data, windowStart: Timestamp.fromMillis(Date.now()) })
        },
      }
      return fn(tx)
    },
  },
}))

const validPayload = {
  name: '홍길동', side: 'groom' as const, attending: true, guestCount: 2,
  mealAttending: true, mealOption: 'korean' as const, companions: '김영희', phone: '010-1234-5678',
}

function putRequest(rsvpId: string, body: unknown) {
  return PUT(
    new NextRequest(`http://localhost/api/rsvp/${rsvpId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
    { params: Promise.resolve({ rsvpId }) }
  )
}

beforeEach(() => {
  invitations.clear()
  rsvps.clear()
  rateLimits.clear()
  invitations.set('inv-1', { status: 'published', rsvpGuestTotal: 2 })
  rsvps.set('inv-1/rsvp-1', { ...validPayload, editToken: 'correct-token' })
})

describe('PUT /api/rsvp/[rsvpId]', () => {
  it('rejects a missing invitationId or editToken', async () => {
    const res = await putRequest('rsvp-1', { ...validPayload })
    expect(res.status).toBe(400)
  })

  it('rejects an invalid payload', async () => {
    const res = await putRequest('rsvp-1', { invitationId: 'inv-1', editToken: 'correct-token', ...validPayload, guestCount: -1 })
    expect(res.status).toBe(400)
  })

  it('returns 404 for an invitation that is not published', async () => {
    invitations.set('inv-1', { status: 'draft' })
    const res = await putRequest('rsvp-1', { invitationId: 'inv-1', editToken: 'correct-token', ...validPayload })
    expect(res.status).toBe(404)
  })

  it('returns 404 when the rsvp document does not exist', async () => {
    const res = await putRequest('missing', { invitationId: 'inv-1', editToken: 'correct-token', ...validPayload })
    expect(res.status).toBe(404)
  })

  it('rejects an edit with the wrong token', async () => {
    const res = await putRequest('rsvp-1', { invitationId: 'inv-1', editToken: 'wrong-token', ...validPayload })
    expect(res.status).toBe(403)
    expect(rsvps.get('inv-1/rsvp-1')).toMatchObject({ name: '홍길동' })
  })

  it('updates the rsvp document in place when the token matches', async () => {
    const res = await putRequest('rsvp-1', {
      invitationId: 'inv-1', editToken: 'correct-token', ...validPayload, attending: false, guestCount: 0,
    })
    expect(res.status).toBe(200)
    expect(rsvps.get('inv-1/rsvp-1')).toMatchObject({ attending: false, editToken: 'correct-token' })
    expect(rsvps.size).toBe(1)
  })

  it('rejects when the edit would push guest total over maxGuests', async () => {
    // rsvp-1 already contributes 2 of the current total of 5 (3 come from other RSVPs).
    invitations.set('inv-1', { status: 'published', rsvpGuestTotal: 5, rsvpSettings: { enabled: true, maxGuests: 6 } })
    const res = await putRequest('rsvp-1', { invitationId: 'inv-1', editToken: 'correct-token', ...validPayload, guestCount: 4 })
    expect(res.status).toBe(409)
    expect(rsvps.get('inv-1/rsvp-1')).toMatchObject({ guestCount: 2 })
  })

  it('allows the edit when it exactly fills the remaining capacity', async () => {
    invitations.set('inv-1', { status: 'published', rsvpGuestTotal: 5, rsvpSettings: { enabled: true, maxGuests: 6 } })
    const res = await putRequest('rsvp-1', { invitationId: 'inv-1', editToken: 'correct-token', ...validPayload, guestCount: 3 })
    expect(res.status).toBe(200)
  })

  it('rejects edits once rsvpSettings.enabled is turned off', async () => {
    invitations.set('inv-1', { status: 'published', rsvpGuestTotal: 2, rsvpSettings: { enabled: false } })
    const res = await putRequest('rsvp-1', { invitationId: 'inv-1', editToken: 'correct-token', ...validPayload })
    expect(res.status).toBe(403)
  })

  it('rate limits after too many edit attempts within the window', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await putRequest('rsvp-1', { invitationId: 'inv-1', editToken: 'correct-token', ...validPayload })
      expect(res.status).not.toBe(429)
    }
    const res = await putRequest('rsvp-1', { invitationId: 'inv-1', editToken: 'correct-token', ...validPayload })
    expect(res.status).toBe(429)
  })
})
