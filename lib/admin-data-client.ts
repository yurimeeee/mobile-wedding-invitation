import { auth } from './firebase'

async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const user = auth.currentUser
  if (!user) throw new Error('로그인이 필요합니다.')
  const token = await user.getIdToken()
  const res = await fetch(path, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `요청에 실패했습니다. (${res.status})`)
  }
  return res.json()
}

export interface AdminStatsResponse {
  totalInvitations: number
  invitationsGrowthPct: number | null
  totalTemplates: number
  totalViews: number
  conversionRatePct: number
  monthly: { month: string; count: number }[]
  templatePopularity: { id: string; name: string; usage: number; percentage: number }[]
  recentInvitations: {
    id: string
    coupleNames: string
    templateId: string | null
    templateName: string
    status: 'draft' | 'published'
    createdAt: string | null
  }[]
}

export interface AdminInvitation {
  id: string
  coupleNames: string
  groomName: string
  brideName: string
  creatorUid: string | null
  creatorEmail: string
  creatorName: string
  templateId: string | null
  templateName: string
  status: 'draft' | 'published'
  slug: string
  createdAt: string | null
  updatedAt: string | null
  views: number
  rsvps: number
}

export interface AdminNoteHistoryEntry {
  date: string
  admin: string
  note: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  joinDate: string | null
  lastSignInAt: string | null
  lastInvitationAt: string | null
  totalCreated: number
  currentlyPublic: number
  disabled: boolean
  note: string
  noteHistory: AdminNoteHistoryEntry[]
}

export function fetchAdminStats() {
  return authedFetch<AdminStatsResponse>('/api/admin/stats')
}

export function fetchAdminInvitations() {
  return authedFetch<{ invitations: AdminInvitation[] }>('/api/admin/invitations')
}

export function fetchAdminUsers() {
  return authedFetch<{ users: AdminUser[] }>('/api/admin/users')
}

export function setUserDisabled(uid: string, disabled: boolean) {
  return authedFetch<{ id: string; disabled: boolean }>(`/api/admin/users/${uid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ disabled }),
  })
}

export function saveUserNote(uid: string, note: string) {
  return authedFetch<{ id: string; note: string; noteHistory: AdminNoteHistoryEntry[] }>(
    `/api/admin/users/${uid}/note`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    }
  )
}
