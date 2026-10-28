import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, PATCH } from './route'

const { adminUsers, invitations, recursiveDeleted, updatedUsers, deletedUsers } = vi.hoisted(() => ({
  adminUsers: new Set<string>(),
  invitations: new Map<string, { uid: string }>(),
  recursiveDeleted: [] as string[],
  updatedUsers: [] as { uid: string; data: unknown }[],
  deletedUsers: [] as string[],
}))

vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    verifyIdToken: async (token: string) => {
      if (token === 'admin-token') return { uid: 'admin-1', email: 'admin@example.com' }
      throw new Error('invalid token')
    },
    updateUser: async (uid: string, data: unknown) => { updatedUsers.push({ uid, data }) },
    deleteUser: async (uid: string) => { deletedUsers.push(uid) },
  },
  adminDb: {
    collection: (name: string) => {
      if (name === 'adminUsers') {
        return { doc: (uid: string) => ({ get: async () => ({ exists: adminUsers.has(uid) }) }) }
      }
      if (name === 'invitations') {
        return {
          doc: (id: string) => ({ __id: id }),
          where: (field: string, _op: string, value: unknown) => ({
            get: async () => ({
              docs: [...invitations.entries()]
                .filter(([, data]) => data[field as keyof typeof data] === value)
                .map(([id]) => ({ id, ref: { __id: id } })),
            }),
          }),
        }
      }
      throw new Error(`unexpected collection: ${name}`)
    },
    recursiveDelete: async (ref: { __id: string }) => { recursiveDeleted.push(ref.__id) },
  },
}))

function patchRequest(body: unknown, auth = 'Bearer admin-token') {
  return PATCH(
    new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json', authorization: auth },
    }),
    { params: Promise.resolve({ uid: 'user-1' }) }
  )
}

function deleteRequest(uid: string, auth = 'Bearer admin-token') {
  return DELETE(
    new NextRequest(`http://localhost/api/admin/users/${uid}`, {
      method: 'DELETE',
      headers: { authorization: auth },
    }),
    { params: Promise.resolve({ uid }) }
  )
}

beforeEach(() => {
  adminUsers.clear()
  adminUsers.add('admin-1')
  invitations.clear()
  recursiveDeleted.length = 0
  updatedUsers.length = 0
  deletedUsers.length = 0
})

describe('PATCH /api/admin/users/[uid]', () => {
  it('rejects a request without a valid admin token', async () => {
    const res = await patchRequest({ disabled: true }, 'Bearer not-an-admin')
    expect(res.status).toBe(401)
    expect(updatedUsers).toHaveLength(0)
  })

  it('rejects a malformed body', async () => {
    const res = await patchRequest({ disabled: 'yes' })
    expect(res.status).toBe(400)
  })

  it('disables the user', async () => {
    const res = await patchRequest({ disabled: true })
    expect(res.status).toBe(200)
    expect(updatedUsers).toEqual([{ uid: 'user-1', data: { disabled: true } }])
  })
})

describe('DELETE /api/admin/users/[uid]', () => {
  it('rejects a request without a valid admin token', async () => {
    const res = await deleteRequest('user-1', 'Bearer not-an-admin')
    expect(res.status).toBe(401)
    expect(deletedUsers).toHaveLength(0)
  })

  it('refuses to delete the admin\'s own account', async () => {
    const res = await deleteRequest('admin-1')
    expect(res.status).toBe(400)
    expect(deletedUsers).toHaveLength(0)
  })

  it('deletes the user\'s invitations before deleting the auth account', async () => {
    invitations.set('inv-1', { uid: 'user-1' })
    invitations.set('inv-2', { uid: 'user-1' })
    invitations.set('inv-3', { uid: 'someone-else' })

    const res = await deleteRequest('user-1')

    expect(res.status).toBe(200)
    expect(recursiveDeleted.sort()).toEqual(['inv-1', 'inv-2'])
    expect(deletedUsers).toEqual(['user-1'])
  })

  it('still deletes the auth account when the user has no invitations', async () => {
    const res = await deleteRequest('user-1')
    expect(res.status).toBe(200)
    expect(recursiveDeleted).toHaveLength(0)
    expect(deletedUsers).toEqual(['user-1'])
  })
})
