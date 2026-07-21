import type { NextRequest } from 'next/server'
import { adminAuth, adminDb } from './firebase-admin'

export interface AdminRequestContext {
  uid: string
  email: string
}

// 관리자 판별은 app/admin 쪽에서 이미 쓰고 있는 `adminUsers/{uid}` 컬렉션 존재 여부를 그대로 따른다.
export async function requireAdminRequest(request: NextRequest): Promise<AdminRequestContext | null> {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return null

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const profileSnap = await adminDb.collection('adminUsers').doc(decoded.uid).get()
    if (!profileSnap.exists) return null
    return { uid: decoded.uid, email: decoded.email ?? '' }
  } catch {
    return null
  }
}
