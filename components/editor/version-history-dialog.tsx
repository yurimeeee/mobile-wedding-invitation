'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { History, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { loadVersions, loadVersionState, type VersionSummary } from '@/lib/version-service'
import { type EditorState } from '@/lib/types'

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invitationId: string
  onRestore: (state: EditorState) => void
}

export function VersionHistoryDialog({ open, onOpenChange, invitationId, onRestore }: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<VersionSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    loadVersions(invitationId)
      .then(setVersions)
      .catch(() => toast.error('버전 기록을 불러오지 못했습니다'))
      .finally(() => setIsLoading(false))
  }, [open, invitationId])

  const handleRestore = async (versionId: string) => {
    setRestoringId(versionId)
    try {
      const state = await loadVersionState(invitationId, versionId)
      if (!state) {
        toast.error('해당 버전을 찾을 수 없습니다')
        return
      }
      onRestore(state)
      toast.success('이전 버전을 불러왔어요. 마음에 들면 임시저장/발행으로 확정하세요')
      onOpenChange(false)
    } catch {
      toast.error('복원에 실패했습니다')
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            버전 기록
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-2">
          임시저장·발행할 때마다 자동으로 스냅샷이 남아요. 원하는 시점으로 되돌릴 수 있어요.
        </p>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && versions.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">아직 저장 기록이 없어요</p>
        )}

        {!isLoading && versions.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
            {versions.map((v, i) => (
              <div key={v.id} className="rounded-lg border p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium">
                      {formatDistanceToNow(v.savedAt, { addSuffix: true, locale: ko })}
                    </p>
                    {i === 0 && <Badge variant="outline" className="text-[10px] px-1.5 py-0">최신</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.label === 'published' ? '발행' : '임시저장'} · {v.savedAt.toLocaleString('ko-KR')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={restoringId !== null}
                  onClick={() => handleRestore(v.id)}
                >
                  {restoringId === v.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  복원
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
