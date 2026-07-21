'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { auth, googleProvider } from '@/lib/firebase'
import { registerSelfAsFirstAdmin } from '@/lib/admin-auth'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { getFirebaseErrorMessage } from '@/lib/firebase-errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export default function AdminLoginPage() {
  const router = useRouter()
  const { user, isAdmin, isBootstrapAvailable, loading, refresh } = useAdminAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (loading || !user) return
    if (isAdmin) {
      router.replace('/admin')
      return
    }
    if (!isBootstrapAvailable) {
      signOut(auth).then(() => setError('관리자 권한이 없는 계정입니다.'))
    }
  }, [loading, user, isAdmin, isBootstrapAvailable, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(getFirebaseErrorMessage(code, '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setIsGoogleLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      if (code !== 'auth/popup-closed-by-user') {
        setError(getFirebaseErrorMessage(code, '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'))
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleRegisterSelf = async () => {
    if (!user) return
    setRegistering(true)
    try {
      await registerSelfAsFirstAdmin(user)
      await refresh()
      router.replace('/admin')
    } catch {
      setError('관리자 등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setRegistering(false)
    }
  }

  if (!loading && user && !isAdmin && isBootstrapAvailable) {
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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut(auth)}
            >
              다른 계정으로 로그인
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Logo width={160} height={28} />
          </Link>
          <h1 className="font-serif text-2xl font-semibold mb-2">관리자 로그인</h1>
          <p className="text-muted-foreground">관리자 계정으로 로그인하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                className="pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading || isGoogleLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">또는 다음으로 계속</span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isGoogleLoading ? '...' : 'Google로 로그인'}
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/login" className="hover:underline">
            일반 사용자 로그인으로 이동
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
