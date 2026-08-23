'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart } from 'lucide-react'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { fetchAdminInvitationState } from '@/lib/admin-data-client'
import { InvitationFullView } from '@/components/invitation/invitation-full-view'
import { Button } from '@/components/ui/button'
import type { EditorState } from '@/lib/types'

export default function AdminInvitationPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, isAdmin, loading: authLoading } = useAdminAuth()
  const [state, setState] = useState<EditorState | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading || !isAdmin || !id) return
    fetchAdminInvitationState(id)
      .then(({ state }) => setState(state))
      .catch((err: Error) => setError(err.message))
  }, [authLoading, isAdmin, id])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        로딩 중...
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">관리자 권한이 필요합니다.</p>
        <Button variant="outline" onClick={() => router.replace('/admin/login')}>
          관리자 로그인으로 이동
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <Heart className="h-10 w-10 opacity-20" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="fixed inset-x-0 top-0 z-[60] flex items-center gap-2 bg-foreground px-3 py-2 text-xs text-background shadow-md">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => router.push('/admin/invitations')}
        >
          <ArrowLeft className="size-3.5" />
          목록으로
        </Button>
        <span>관리자 미리보기 (읽기 전용) · ID: {id}</span>
      </div>
      <div className="pt-9">
        {state ? (
          <InvitationFullView state={state} invitationId={id} bypassLock />
        ) : (
          <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
            불러오는 중...
          </div>
        )}
      </div>
    </div>
  )
}
