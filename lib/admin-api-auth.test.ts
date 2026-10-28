import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAdminRequest } from './admin-api-auth'

const { adminUsers, verifyIdToken } = vi.hoisted(() => ({
  adminUsers: new Map<string, Record<string, unknown>>(),
  verifyIdToken: vi.fn(async (token: string) => {
    if (token === 'valid-admin') return { uid: 'admin-1', email: 'admin@example.com' }
    if (token === 'valid-non-admin') return { uid: 'user-1', email: 'user@example.com' }
    throw new Error('invalid token')
  }),
}))

vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: { verifyIdToken },
  adminDb: {
    collection: (name: string) => {
      if (name !== 'adminUsers') throw new Error(`unexpected collection: ${name}`)
      return { doc: (uid: string) => ({ get: async () => ({ exists: adminUsers.has(uid) }) }) }
    },
  },
}))

function requestWithAuth(header: string | null) {
  return new NextRequest('http://localhost/api/admin/test', {
    headers: header ? { authorization: header } : undefined,
  })
}

beforeEach(() => {
  adminUsers.clear()
})

describe('requireAdminRequest', () => {
  it('returns null when there is no authorization header', async () => {
    expect(await requireAdminRequest(requestWithAuth(null))).toBeNull()
  })

  it('returns null when the token is invalid', async () => {
    expect(await requireAdminRequest(requestWithAuth('Bearer not-a-real-token'))).toBeNull()
  })

  it('returns null when the token is valid but the uid is not in adminUsers', async () => {
    expect(await requireAdminRequest(requestWithAuth('Bearer valid-non-admin'))).toBeNull()
  })

  it('returns the admin context when the uid is in adminUsers', async () => {
    adminUsers.set('admin-1', {})
    expect(await requireAdminRequest(requestWithAuth('Bearer valid-admin'))).toEqual({
      uid: 'admin-1',
      email: 'admin@example.com',
    })
  })
})
