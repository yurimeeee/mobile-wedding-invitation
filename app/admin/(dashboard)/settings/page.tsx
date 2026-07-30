'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

import { AdminHeader } from '@/components/admin/admin-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';
import { toast } from 'sonner';
import { useAdminAuthContext } from '@/hooks/use-admin-auth';
import { useState } from 'react';

export default function AdminSettingsPage() {
  const { user } = useAdminAuthContext();
  const hasPasswordProvider = user?.providerData.some((p) => p.providerId === 'password') ?? false;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    if (!user?.email) return;

    setIsLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(
        getFirebaseErrorMessage(code, '비밀번호 변경에 실패했습니다. 다시 시도해주세요.', {
          'auth/wrong-password': '현재 비밀번호가 올바르지 않습니다.',
          'auth/invalid-credential': '현재 비밀번호가 올바르지 않습니다.',
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AdminHeader breadcrumb="설정" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">설정</h1>
          <p className="mt-1 text-sm text-muted-foreground">계정 보안 설정을 관리합니다.</p>
        </div>

        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>비밀번호 변경</CardTitle>
            <CardDescription>
              {hasPasswordProvider ? '현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.' : 'Google 계정으로 로그인 중입니다. 비밀번호는 Google 계정에서 관리해주세요.'}
            </CardDescription>
          </CardHeader>

          {hasPasswordProvider && (
            <form onSubmit={handleSubmit}>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">현재 비밀번호</Label>
                  <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">새 비밀번호</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="최소 6자 이상" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </CardContent>
              <CardFooter className="mt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? '변경 중...' : '비밀번호 변경'}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </main>
    </>
  );
}
