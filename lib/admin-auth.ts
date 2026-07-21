import { doc, getDoc, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './firebase'

export interface AdminProfile {
  uid: string
  email: string
  name: string
  role: string
  createdAt: Timestamp | null
  createdBy: string | null
}

export async function getAdminProfile(uid: string): Promise<AdminProfile | null> {
  const snap = await getDoc(doc(db, 'adminUsers', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    uid,
    email: data.email,
    name: data.name,
    role: data.role,
    createdAt: data.createdAt ?? null,
    createdBy: data.createdBy ?? null,
  }
}

export async function isBootstrapUsed(): Promise<boolean> {
  const snap = await getDoc(doc(db, 'adminMeta', 'bootstrap'))
  return snap.exists()
}

export async function registerSelfAsFirstAdmin(user: User): Promise<void> {
  const batch = writeBatch(db)
  batch.set(doc(db, 'adminUsers', user.uid), {
    email: user.email ?? '',
    name: user.displayName ?? user.email ?? '관리자',
    role: 'admin',
    createdAt: serverTimestamp(),
    createdBy: null,
  })
  batch.set(doc(db, 'adminMeta', 'bootstrap'), {
    initializedBy: user.uid,
    initializedAt: serverTimestamp(),
  })
  await batch.commit()
}
