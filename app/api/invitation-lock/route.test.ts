import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import { POST } from './route'

const { invitations, rateLimits } = vi.hoisted(() => ({
  invitations: new Map<string, Record<string, unknown>>(),
  rateLimits: new Map<string, Record<string, unknown>>(),
}))

// Admin SDK 호출 경로만 흉내 낸다 — 실제 FieldValue/increment 반영까지 재현하지 않고,
// 라우트가 올바른 분기를 타는지(요청 빈도 제한/비밀번호 대조/만료)만 검증한다.
vi.mock('@/lib/firebase-admin', () => {
  function makeInvitationDocRef(id: string) {
    return {
      get: async () => ({
        exists: invitations.has(id),
        data: () => invitations.get(id),
      }),
      collection: (name: string) => {
        if (name === 'lockAttempts') {
          return { doc: (ipHash: string) => ({ __key: `${id}/lockAttempts/${ipHash}` }) }
        }
        if (name === 'private') {
          return { doc: (docId: string) => ({ get: async () => ({ data: () => invitations.get(`${id}/private/${docId}`) }) }) }
        }
        throw new Error(`unexpected subcollection: ${name}`)
      },
    }
  }

  return {
    adminDb: {
      collection: (name: string) => {
        if (name !== 'invitations') throw new Error(`unexpected collection: ${name}`)
        return {
          doc: (id: string) => makeInvitationDocRef(id),
          where: (field: string, _op: string, value: unknown) => ({
            limit: () => ({
              get: async () => {
                const match = [...invitations.entries()].find(([key, data]) => !key.includes('/') && data[field] === value)
                return { empty: !match, docs: match ? [{ ref: makeInvitationDocRef(match[0]) }] : [] }
              },
            }),
          }),
        }
      },
      runTransaction: async (fn: (tx: unknown) => unknown) => {
        const tx = {
          get: async (ref: { __key: string }) => ({
            data: () => rateLimits.get(ref.__key),
          }),
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
  }
})

function postRequest(body: unknown) {
  return POST(new NextRequest('http://localhost/api/invitation-lock', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }))
}

beforeEach(() => {
  invitations.clear()
  rateLimits.clear()
})

describe('POST /api/invitation-lock', () => {
  it('rejects a malformed body', async () => {
    const res = await postRequest({ id: 'inv-1' })
    expect(res.status).toBe(400)
  })

  it('returns 404 when the invitation does not exist', async () => {
    const res = await postRequest({ id: 'missing', password: 'x' })
    expect(res.status).toBe(404)
  })

  it('returns 404 when the invitation is not published', async () => {
    invitations.set('inv-1', { status: 'draft', privacySettings: { lockEnabled: true } })
    const res = await postRequest({ id: 'inv-1', password: 'x' })
    expect(res.status).toBe(404)
  })

  it('returns 404 when the invitation has expired', async () => {
    invitations.set('inv-1', {
      status: 'published',
      privacySettings: { lockEnabled: true },
      expiresAt: Timestamp.fromMillis(Date.now() - 1000),
    })
    const res = await postRequest({ id: 'inv-1', password: 'x' })
    expect(res.status).toBe(404)
  })

  it('returns ok:false without checking the password when the lock is disabled', async () => {
    invitations.set('inv-1', { status: 'published', privacySettings: { lockEnabled: false } })
    invitations.set('inv-1/private/lock', { password: 'secret' })
    const res = await postRequest({ id: 'inv-1', password: 'anything' })
    expect(await res.json()).toEqual({ ok: false })
  })

  it('returns ok:true for the correct password', async () => {
    invitations.set('inv-1', { status: 'published', privacySettings: { lockEnabled: true } })
    invitations.set('inv-1/private/lock', { password: 'secret' })
    const res = await postRequest({ id: 'inv-1', password: 'secret' })
    expect(await res.json()).toEqual({ ok: true })
  })

  it('returns ok:false for the wrong password', async () => {
    invitations.set('inv-1', { status: 'published', privacySettings: { lockEnabled: true } })
    invitations.set('inv-1/private/lock', { password: 'secret' })
    const res = await postRequest({ id: 'inv-1', password: 'nope' })
    expect(await res.json()).toEqual({ ok: false })
  })

  it('resolves the invitation by slug when id does not match a document id', async () => {
    invitations.set('inv-1', { status: 'published', privacySettings: { lockEnabled: true }, slug: 'our-wedding' })
    invitations.set('inv-1/private/lock', { password: 'secret' })
    const res = await postRequest({ id: 'our-wedding', password: 'secret' })
    expect(await res.json()).toEqual({ ok: true })
  })

  it('rate limits after too many attempts within the window', async () => {
    invitations.set('inv-1', { status: 'published', privacySettings: { lockEnabled: true } })
    invitations.set('inv-1/private/lock', { password: 'secret' })

    for (let i = 0; i < 10; i++) {
      const res = await postRequest({ id: 'inv-1', password: 'nope' })
      expect(res.status).not.toBe(429)
    }
    const res = await postRequest({ id: 'inv-1', password: 'secret' })
    expect(res.status).toBe(429)
  })
})
