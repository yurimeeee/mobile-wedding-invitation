'use client'

import { AuthContext, useAuthState } from '@/hooks/use-auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authState = useAuthState()
  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}
