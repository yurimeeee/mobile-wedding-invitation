'use client';

import { Mail, CheckCircle2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail, type ActionCodeSettings } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // 비밀번호 재설정은 항상 Firebase 호스팅 페이지(.../__/auth/action)를 먼저 거치고,
      // 이 url은 그 페이지에서 재설정을 마친 뒤 보여주는 "계속하기" 링크로만 쓰인다.
      // 이 시점엔 oobCode가 이미 소모된 뒤라 /reset-password로 보내면 "만료된 링크"로
      // 오인되므로 사이트 루트로 보낸다.
      const actionCodeSettings: ActionCodeSettings = {
        url: window.location.origin,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      setSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      // 이메일 존재 여부를 노출하지 않기 위해 가입된 이메일이 없어도 발송 성공과 동일하게 안내한다.
      if (code === 'auth/user-not-found') {
        setSent(true);
      } else {
        setError(
          getFirebaseErrorMessage(code, '재설정 링크 발송 중 오류가 발생했습니다. 다시 시도해주세요.')
        );
      }
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
          {sent ? (
            <>
              <h1 className="font-serif text-2xl font-semibold mb-2">이메일을 확인해주세요</h1>
              <p className="text-muted-foreground">
                입력하신 이메일 주소로 비밀번호 재설정 링크를 보냈습니다.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-2xl font-semibold mb-2">비밀번호를 잊으셨나요?</h1>
              <p className="text-muted-foreground">
                가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
              </p>
            </>
          )}
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-accent/5 p-4">
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{email}</span>
                {'(으)로 메일을 보냈습니다. 메일이 보이지 않는다면 스팸함도 확인해주세요.'}
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              다른 이메일로 다시 보내기
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? '보내는 중...' : '재설정 링크 보내기'}
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-foreground font-medium hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
