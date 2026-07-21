import { NextResponse, type NextRequest } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { requireAdminRequest } from '@/lib/admin-api-auth'

export async function GET(request: NextRequest) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const [invitationsSnap, notesSnap, authUsers] = await Promise.all([
    adminDb.collection('invitations').get(),
    adminDb.collection('adminUserNotes').get(),
    listAllAuthUsers(),
  ])

  interface NoteHistoryEntry {
    date: string
    admin: string
    note: string
  }
  const notesByUid = new Map<string, { note: string; noteHistory: NoteHistoryEntry[] }>()
  for (const doc of notesSnap.docs) {
    const d = doc.data() as { note?: string; noteHistory?: NoteHistoryEntry[] }
    notesByUid.set(doc.id, { note: d.note ?? '', noteHistory: d.noteHistory ?? [] })
  }

  const statsByUid = new Map<string, { totalCreated: number; currentlyPublic: number; lastInvitationAt: Date | null }>()
  for (const doc of invitationsSnap.docs) {
    const d = doc.data()
    const uid = d.uid as string | undefined
    if (!uid) continue
    const entry = statsByUid.get(uid) ?? { totalCreated: 0, currentlyPublic: 0, lastInvitationAt: null }
    entry.totalCreated += 1
    if (d.status === 'published') entry.currentlyPublic += 1
    const updatedAt = d.updatedAt?.toDate?.() ?? null
    if (updatedAt && (!entry.lastInvitationAt || updatedAt > entry.lastInvitationAt)) entry.lastInvitationAt = updatedAt
    statsByUid.set(uid, entry)
  }

  const users = authUsers.map((user) => {
    const stats = statsByUid.get(user.uid) ?? { totalCreated: 0, currentlyPublic: 0, lastInvitationAt: null }
    const notes = notesByUid.get(user.uid) ?? { note: '', noteHistory: [] }
    return {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || '이름 없음',
      email: user.email ?? '',
      joinDate: user.metadata.creationTime ? new Date(user.metadata.creationTime).toISOString() : null,
      lastSignInAt: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toISOString() : null,
      lastInvitationAt: stats.lastInvitationAt ? stats.lastInvitationAt.toISOString() : null,
      totalCreated: stats.totalCreated,
      currentlyPublic: stats.currentlyPublic,
      disabled: user.disabled,
      note: notes.note,
      noteHistory: notes.noteHistory,
    }
  })

  return NextResponse.json({ users })
}

async function listAllAuthUsers() {
  const all = []
  let pageToken: string | undefined
  do {
    const page = await adminAuth.listUsers(1000, pageToken)
    all.push(...page.users)
    pageToken = page.pageToken
  } while (pageToken)
  return all
}
