'use client';

import { Eye, EyeOff, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';

type Status = 'verifying' | 'ready' | 'invalid' | 'success';

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>('verifying');
  const [oobCode, setOobCode] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('oobCode')
    if (!code) {
      setStatus('invalid')
      return
    }
    setOobCode(code)
    verifyPasswordResetCode(auth, code)
      .then((resolvedEmail) => {
        setEmail(resolvedEmail)
        setStatus('ready')
      })
      .catch(() => setStatus('invalid'))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(getFirebaseErrorMessage(code, '비밀번호 변경에 실패했습니다. 다시 시도해주세요.'));
    } finally {
      setIsLoading(false);
    }
  };

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

          {status === 'verifying' && (
            <>
              <h1 className="font-serif text-2xl font-semibold mb-2">확인 중...</h1>
              <p className="text-muted-foreground">재설정 링크를 확인하고 있습니다.</p>
            </>
          )}
          {status === 'invalid' && (
            <>
              <h1 className="font-serif text-2xl font-semibold mb-2">유효하지 않은 링크</h1>
              <p className="text-muted-foreground">
                링크가 만료되었거나 이미 사용되었습니다. 비밀번호 찾기를 다시 시도해주세요.
              </p>
            </>
          )}
          {status === 'ready' && (
            <>
              <h1 className="font-serif text-2xl font-semibold mb-2">새 비밀번호 설정</h1>
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">{email}</span>
                {'의 새 비밀번호를 입력해주세요.'}
              </p>
            </>
          )}
          {status === 'success' && (
            <>
              <h1 className="font-serif text-2xl font-semibold mb-2">비밀번호가 변경되었습니다</h1>
              <p className="text-muted-foreground">새 비밀번호로 다시 로그인해주세요.</p>
            </>
          )}
        </div>

        {status === 'invalid' && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-destructive/5 p-4">
              <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                링크는 한 번만 사용할 수 있고, 발급 후 일정 시간이 지나면 만료됩니다.
              </p>
            </div>
            <Button asChild className="w-full" size="lg">
              <Link href="/forgot-password">비밀번호 찾기 다시 시도</Link>
            </Button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-accent/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">비밀번호가 안전하게 변경되었습니다.</p>
            </div>
            <Button asChild className="w-full" size="lg">
              <Link href="/login">로그인하러 가기</Link>
            </Button>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="최소 6자 이상"
                  className="pl-10 pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <div className="space-y-2">
              <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </form>
        )}

        {(status === 'ready' || status === 'verifying') && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-foreground font-medium hover:underline">
              로그인으로 돌아가기
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
