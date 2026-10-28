import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import { DELETE, GET } from './route'

const { invitations, deletedRefs, getUsersCalls } = vi.hoisted(() => ({
  invitations: new Map<string, Record<string, unknown>>(),
  deletedRefs: [] as string[],
  getUsersCalls: [] as { uid: string }[][],
}))

vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    verifyIdToken: async (token: string) => {
      if (token === 'admin-token') return { uid: 'admin-1', email: 'admin@example.com' }
      throw new Error('invalid token')
    },
    getUsers: async (identifiers: { uid: string }[]) => {
      getUsersCalls.push(identifiers)
      const users = identifiers
        .filter((i) => i.uid === 'user-1')
        .map((i) => ({ uid: i.uid, email: 'user1@example.com', displayName: '사용자1' }))
      const notFound = identifiers.filter((i) => i.uid !== 'user-1')
      return { users, notFound }
    },
  },
  adminDb: {
    collection: (name: string) => {
      if (name === 'adminUsers') {
        return { doc: (uid: string) => ({ get: async () => ({ exists: uid === 'admin-1' }) }) }
      }
      if (name === 'invitations') {
        return {
          get: async () => ({
            docs: [...invitations.entries()].map(([id, data]) => ({ id, data: () => data })),
          }),
          doc: (id: string) => ({ __id: id }),
        }
      }
      throw new Error(`unexpected collection: ${name}`)
    },
    collectionGroup: (name: string) => {
      if (name !== 'rsvps') throw new Error(`unexpected collectionGroup: ${name}`)
      return { select: () => ({ get: async () => ({ docs: [] }) }) }
    },
    recursiveDelete: async (ref: { __id: string }) => { deletedRefs.push(ref.__id) },
  },
}))

function getRequest(auth = 'Bearer admin-token') {
  return GET(new NextRequest('http://localhost/api/admin/invitations', { headers: { authorization: auth } }))
}

function deleteRequest(ids: unknown, auth = 'Bearer admin-token') {
  return DELETE(new NextRequest('http://localhost/api/admin/invitations', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
    headers: { 'content-type': 'application/json', authorization: auth },
  }))
}

beforeEach(() => {
  invitations.clear()
  deletedRefs.length = 0
  getUsersCalls.length = 0
})

describe('GET /api/admin/invitations', () => {
  it('rejects a request without a valid admin token', async () => {
    const res = await getRequest('Bearer not-an-admin')
    expect(res.status).toBe(401)
  })

  it('resolves creator info for known and deleted users in a single batched call', async () => {
    invitations.set('inv-1', { uid: 'user-1', status: 'published', viewCount: 5, createdAt: Timestamp.fromMillis(0) })
    invitations.set('inv-2', { uid: 'user-2', status: 'draft', viewCount: 0, createdAt: Timestamp.fromMillis(0) })

    const res = await getRequest()
    const body = await res.json()

    expect(getUsersCalls).toHaveLength(1)
    expect(getUsersCalls[0].map((i) => i.uid).sort()).toEqual(['user-1', 'user-2'])

    const byId = Object.fromEntries(body.invitations.map((inv: { id: string }) => [inv.id, inv]))
    expect(byId['inv-1']).toMatchObject({ creatorEmail: 'user1@example.com', creatorName: '사용자1' })
    expect(byId['inv-2']).toMatchObject({ creatorEmail: '', creatorName: '탈퇴한 사용자' })
  })
})

describe('DELETE /api/admin/invitations', () => {
  it('rejects a request without a valid admin token', async () => {
    const res = await deleteRequest(['inv-1'], 'Bearer not-an-admin')
    expect(res.status).toBe(401)
    expect(deletedRefs).toHaveLength(0)
  })

  it('rejects more than 50 ids at once', async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `inv-${i}`)
    const res = await deleteRequest(ids)
    expect(res.status).toBe(400)
    expect(deletedRefs).toHaveLength(0)
  })

  it('deletes each given id', async () => {
    const res = await deleteRequest(['inv-1', 'inv-2'])
    expect(res.status).toBe(200)
    expect(deletedRefs.sort()).toEqual(['inv-1', 'inv-2'])
  })
})
