import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const { adminUsers, createdUsers, savedAdminDocs } = vi.hoisted(() => ({
  adminUsers: new Set<string>(),
  createdUsers: [] as { email: string; password: string; displayName: string }[],
  savedAdminDocs: new Map<string, Record<string, unknown>>(),
}))

vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    verifyIdToken: async (token: string) => {
      if (token === 'admin-token') return { uid: 'admin-1', email: 'admin@example.com' }
      throw new Error('invalid token')
    },
    createUser: async (data: { email: string; password: string; displayName: string }) => {
      createdUsers.push(data)
      return { uid: 'new-admin-1' }
    },
  },
  adminDb: {
    collection: (name: string) => {
      if (name !== 'adminUsers') throw new Error(`unexpected collection: ${name}`)
      return {
        doc: (uid: string) => ({
          get: async () => ({ exists: adminUsers.has(uid) }),
          set: async (data: Record<string, unknown>) => { savedAdminDocs.set(uid, data) },
        }),
      }
    },
  },
}))

function postRequest(body: unknown, auth = 'Bearer admin-token') {
  return POST(new NextRequest('http://localhost/api/admin/create-admin', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', authorization: auth },
  }))
}

beforeEach(() => {
  adminUsers.clear()
  adminUsers.add('admin-1')
  createdUsers.length = 0
  savedAdminDocs.clear()
})

describe('POST /api/admin/create-admin', () => {
  it('rejects a request without a valid admin token', async () => {
    const res = await postRequest({ name: '홍길동', email: 'a@b.com', password: '123456' }, 'Bearer not-an-admin')
    expect(res.status).toBe(401)
    expect(createdUsers).toHaveLength(0)
  })

  it('rejects an invalid payload (short password)', async () => {
    const res = await postRequest({ name: '홍길동', email: 'a@b.com', password: '123' })
    expect(res.status).toBe(400)
    expect(createdUsers).toHaveLength(0)
  })

  it('creates the admin user and records who created it', async () => {
    const res = await postRequest({ name: '홍길동', email: 'a@b.com', password: '123456' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ uid: 'new-admin-1' })
    expect(createdUsers).toEqual([{ email: 'a@b.com', password: '123456', displayName: '홍길동' }])
    expect(savedAdminDocs.get('new-admin-1')).toMatchObject({ email: 'a@b.com', name: '홍길동', createdBy: 'admin-1' })
  })
})
