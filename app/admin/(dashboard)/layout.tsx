'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { toast } from 'sonner'
import { auth } from '@/lib/firebase'
import { registerSelfAsFirstAdmin } from '@/lib/admin-auth'
import { useAdminAuth, AdminAuthContext } from '@/hooks/use-admin-auth'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const authState = useAdminAuth()
  const { user, isAdmin, isBootstrapAvailable, loading, refresh } = authState
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/admin/login')
    }
  }, [loading, user, router])

  const handleRegisterSelf = async () => {
    if (!user) return
    setRegistering(true)
    try {
      await registerSelfAsFirstAdmin(user)
      await refresh()
      toast.success('관리자로 등록되었습니다.')
    } catch {
      toast.error('관리자 등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setRegistering(false)
    }
  }

  const handleSignOutAndSwitch = async () => {
    await signOut(auth)
    router.replace('/admin/login')
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!isAdmin && isBootstrapAvailable) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>첫 관리자 등록</CardTitle>
            <CardDescription>
              아직 등록된 관리자가 없습니다. 현재 로그인된 계정({user.email})을 관리자로 등록할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleRegisterSelf} disabled={registering}>
              {registering ? '등록 중...' : '현재 계정을 관리자로 등록'}
            </Button>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleSignOutAndSwitch}>
              다른 계정으로 로그인
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>권한이 없습니다</CardTitle>
            <CardDescription>
              이 계정({user.email})은 관리자 권한이 없습니다. 관리자에게 계정 등록을 요청해주세요.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleSignOutAndSwitch}>
              다른 계정으로 로그인
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <AdminAuthContext.Provider value={authState}>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </AdminAuthContext.Provider>
  )
}
