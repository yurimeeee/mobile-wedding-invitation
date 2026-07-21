import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getAdminProfile, isBootstrapUsed, type AdminProfile } from '@/lib/admin-auth'

export interface UseAdminAuthResult {
  user: User | null
  adminProfile: AdminProfile | null
  isAdmin: boolean
  isBootstrapAvailable: boolean
  loading: boolean
  refresh: () => Promise<void>
}

export function useAdminAuth(): UseAdminAuthResult {
  const [user, setUser] = useState<User | null>(null)
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null)
  const [isBootstrapAvailable, setIsBootstrapAvailable] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadForUser = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setAdminProfile(null)
      setIsBootstrapAvailable(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const [profile, bootstrapUsed] = await Promise.all([
      getAdminProfile(currentUser.uid),
      isBootstrapUsed(),
    ])
    setAdminProfile(profile)
    setIsBootstrapAvailable(!profile && !bootstrapUsed)
    setLoading(false)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      void loadForUser(currentUser)
    })
    return () => unsubscribe()
  }, [loadForUser])

  const refresh = useCallback(async () => {
    await loadForUser(auth.currentUser)
  }, [loadForUser])

  return {
    user,
    adminProfile,
    isAdmin: adminProfile !== null,
    isBootstrapAvailable,
    loading,
    refresh,
  }
}

export const AdminAuthContext = createContext<UseAdminAuthResult | null>(null)

export function useAdminAuthContext(): UseAdminAuthResult {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuthContext must be used within AdminAuthContext.Provider')
  return ctx
}
