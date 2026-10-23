import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import { DELETE } from './route'

const { messages, rateLimits, deletedPrivateContent } = vi.hoisted(() => ({
  messages: new Map<string, Record<string, unknown>>(),
  rateLimits: new Map<string, Record<string, unknown>>(),
  deletedPrivateContent: new Set<string>(),
}))

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => {
      if (name !== 'invitations') throw new Error(`unexpected collection: ${name}`)
      return {
        doc: (invitationId: string) => ({
          collection: (sub: string) => {
            if (sub === 'messageDeleteAttempts') {
              return { doc: (ipHash: string) => ({ __key: `${invitationId}/${ipHash}` }) }
            }
            if (sub === 'messages') {
              return {
                doc: (messageId: string) => {
                  const key = `${invitationId}/${messageId}`
                  return {
                    get: async () => ({ exists: messages.has(key), data: () => messages.get(key) }),
                    delete: async () => { messages.delete(key) },
                    collection: (privateSub: string) => {
                      if (privateSub !== 'private') throw new Error(`unexpected subcollection: ${privateSub}`)
                      return { doc: (docId: string) => ({ delete: async () => { deletedPrivateContent.add(`${key}/${docId}`) } }) }
                    },
                  }
                },
              }
            }
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

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex')
}

function deleteRequest(body: unknown) {
  return DELETE(new NextRequest('http://localhost/api/guest-message', {
    method: 'DELETE',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }))
}

beforeEach(() => {
  messages.clear()
  rateLimits.clear()
  deletedPrivateContent.clear()
})

describe('DELETE /api/guest-message', () => {
  it('rejects a malformed body', async () => {
    const res = await deleteRequest({ invitationId: 'inv-1' })
    expect(res.status).toBe(400)
  })

  it('returns ok:false when the message does not exist', async () => {
    const res = await deleteRequest({ invitationId: 'inv-1', messageId: 'missing', password: 'x' })
    expect(await res.json()).toEqual({ ok: false })
  })

  it('deletes the message and its private content when the password matches (salted)', async () => {
    const salt = 'abc123'
    messages.set('inv-1/m1', { passwordHash: hashPassword('secret', salt), salt })

    const res = await deleteRequest({ invitationId: 'inv-1', messageId: 'm1', password: 'secret' })

    expect(await res.json()).toEqual({ ok: true })
    expect(messages.has('inv-1/m1')).toBe(false)
    expect(deletedPrivateContent.has('inv-1/m1/content')).toBe(true)
  })

  it('verifies legacy (unsalted) hashes for messages saved before salt was introduced', async () => {
    messages.set('inv-1/m1', { passwordHash: createHash('sha256').update('secret').digest('hex') })

    const res = await deleteRequest({ invitationId: 'inv-1', messageId: 'm1', password: 'secret' })

    expect(await res.json()).toEqual({ ok: true })
    expect(messages.has('inv-1/m1')).toBe(false)
  })

  it('does not delete when the password is wrong', async () => {
    const salt = 'abc123'
    messages.set('inv-1/m1', { passwordHash: hashPassword('secret', salt), salt })

    const res = await deleteRequest({ invitationId: 'inv-1', messageId: 'm1', password: 'wrong' })

    expect(await res.json()).toEqual({ ok: false })
    expect(messages.has('inv-1/m1')).toBe(true)
  })

  it('rate limits after too many delete attempts within the window', async () => {
    const salt = 'abc123'
    messages.set('inv-1/m1', { passwordHash: hashPassword('secret', salt), salt })

    for (let i = 0; i < 10; i++) {
      const res = await deleteRequest({ invitationId: 'inv-1', messageId: 'm1', password: 'wrong' })
      expect(res.status).not.toBe(429)
    }
    const res = await deleteRequest({ invitationId: 'inv-1', messageId: 'm1', password: 'secret' })
    expect(res.status).toBe(429)
    expect(messages.has('inv-1/m1')).toBe(true)
  })
})
