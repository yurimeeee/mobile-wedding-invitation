import { NextResponse, type NextRequest } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAdminRequest } from '@/lib/admin-api-auth'

interface NoteHistoryEntry {
  date: string
  admin: string
  note: string
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const { uid } = await params
  const body = await request.json().catch(() => null) as { note?: string } | null
  if (typeof body?.note !== 'string') {
    return NextResponse.json({ error: 'note(string) 값이 필요합니다.' }, { status: 400 })
  }
  const note = body.note

  const docRef = adminDb.collection('adminUserNotes').doc(uid)
  const snap = await docRef.get()
  const existing = snap.exists ? (snap.data() as { noteHistory?: NoteHistoryEntry[] }) : {}
  const noteHistory = existing.noteHistory ?? []

  const nowIso = new Date().toISOString().slice(0, 10)
  const updatedHistory = note
    ? [...noteHistory, { date: nowIso, admin: admin.email, note }]
    : noteHistory

  await docRef.set(
    { note, noteHistory: updatedHistory, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  )

  return NextResponse.json({ id: uid, note, noteHistory: updatedHistory })
}
