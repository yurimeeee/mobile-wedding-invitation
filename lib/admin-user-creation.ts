import { auth } from './firebase'

interface CreateAdminAccountParams {
  name: string
  email: string
  password: string
}

function mapServerErrorCode(serverCode: string | undefined): string {
  switch (serverCode) {
    case 'auth/email-already-exists':
      return 'auth/email-already-in-use'
    case 'auth/invalid-password':
      return 'auth/weak-password'
    case 'auth/invalid-email':
      return 'auth/invalid-email'
    default:
      return ''
  }
}

export async function createAdminAccount({
  name,
  email,
  password,
}: CreateAdminAccountParams): Promise<string> {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('not-authenticated')
  const idToken = await currentUser.getIdToken()

  const res = await fetch('/api/admin/create-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ name, email, password }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data?.error ?? 'unknown') as Error & { code?: string }
    error.code = mapServerErrorCode(data?.error)
    throw error
  }

  return data.uid as string
}
