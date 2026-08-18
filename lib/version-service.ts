import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs,
  limit, orderBy, query, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { EditorState } from './types'

const MAX_VERSIONS = 20

export interface VersionSummary {
  id: string
  label: 'draft' | 'published'
  savedAt: Date
}

function versionsCollection(invitationId: string) {
  return collection(db, 'invitations', invitationId, 'versions')
}

export async function saveVersionSnapshot(
  invitationId: string,
  state: EditorState,
  label: 'draft' | 'published'
): Promise<void> {
  await addDoc(versionsCollection(invitationId), {
    state,
    label,
    savedAt: serverTimestamp(),
  })

  const snap = await getDocs(query(versionsCollection(invitationId), orderBy('savedAt', 'desc')))
  const excess = snap.docs.slice(MAX_VERSIONS)
  await Promise.all(excess.map((d) => deleteDoc(doc(db, 'invitations', invitationId, 'versions', d.id))))
}

export async function loadVersions(invitationId: string): Promise<VersionSummary[]> {
  const q = query(versionsCollection(invitationId), orderBy('savedAt', 'desc'), limit(MAX_VERSIONS))
  const snap = await getDocs(q)
  return snap.docs.map((docSnap) => {
    const d = docSnap.data()
    return {
      id: docSnap.id,
      label: d.label === 'published' ? 'published' : 'draft',
      savedAt: d.savedAt instanceof Timestamp ? d.savedAt.toDate() : new Date(),
    }
  })
}

export async function loadVersionState(invitationId: string, versionId: string): Promise<EditorState | null> {
  const snap = await getDoc(doc(db, 'invitations', invitationId, 'versions', versionId))
  if (!snap.exists()) return null
  return (snap.data().state as EditorState) ?? null
}
