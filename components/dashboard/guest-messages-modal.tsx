'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Lock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteGuestMessage, loadGuestMessages, type GuestMessage, type GuestMessageCursor } from '@/lib/message-service'

interface GuestMessagesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invitationId: string
  title: string
}

export function GuestMessagesModal({ open, onOpenChange, invitationId, title }: GuestMessagesModalProps) {
  const [messages, setMessages] = useState<GuestMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [cursor, setCursor] = useState<GuestMessageCursor | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    loadGuestMessages(invitationId, { includeSecretContents: true })
      .then((page) => {
        setMessages(page.messages)
        setCursor(page.cursor)
        setHasMore(page.hasMore)
      })
      .catch(() => toast.error('메시지를 불러오지 못했습니다'))
      .finally(() => setIsLoading(false))
  }, [open, invitationId])

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    try {
      const page = await loadGuestMessages(invitationId, { includeSecretContents: true, cursor })
      setMessages((prev) => [...prev, ...page.messages])
      setCursor(page.cursor)
      setHasMore(page.hasMore)
    } catch {
      toast.error('메시지를 더 불러오지 못했습니다')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleDelete = async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
    try {
      await deleteGuestMessage(invitationId, messageId)
      toast.success('메시지가 삭제되었습니다')
    } catch {
      toast.error('삭제에 실패했습니다')
      loadGuestMessages(invitationId, { includeSecretContents: true })
        .then((page) => { setMessages(page.messages); setCursor(page.cursor); setHasMore(page.hasMore) })
        .catch(() => {})
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>방명록</DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{title}</p>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">아직 남겨진 메시지가 없어요</p>
        )}

        {!isLoading && messages.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
            {messages.map((msg) => (
              <div key={msg.id} className="rounded-lg border p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    {msg.name}
                    {msg.secret && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-normal text-muted-foreground border rounded px-1 py-0.5">
                        <Lock className="h-2.5 w-2.5" />비밀글
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line break-words">{msg.contents}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{msg.createdAt.toLocaleDateString('ko-KR')}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive"
                  onClick={() => handleDelete(msg.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {hasMore && (
              <Button variant="outline" size="sm" className="w-full" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore ? '불러오는 중...' : '더 보기'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
