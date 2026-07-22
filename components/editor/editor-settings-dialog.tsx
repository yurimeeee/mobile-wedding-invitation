'use client'

import { useState } from 'react'
import { Copy, Loader2, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { SlugInput } from '@/components/editor/slug-input'
import { deleteInvitation, duplicateInvitation } from '@/lib/invitation-service'
import { toast } from 'sonner'

interface EditorSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  uid: string
  invitationId: string
  slug: string
  onSlugChange: (slug: string) => void
  onDeleted: () => void
  onDuplicated: (newId: string) => void
}

export function EditorSettingsDialog({
  open,
  onOpenChange,
  uid,
  invitationId,
  slug,
  onSlugChange,
  onDeleted,
  onDuplicated,
}: EditorSettingsDialogProps) {
  const [duplicating, setDuplicating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDuplicate = async () => {
    setDuplicating(true)
    try {
      const newId = await duplicateInvitation(uid, invitationId)
      toast.success('청첩장이 복제되었습니다')
      onOpenChange(false)
      onDuplicated(newId)
    } catch {
      toast.error('복제에 실패했습니다')
    } finally {
      setDuplicating(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteInvitation(invitationId)
      toast.success('청첩장이 삭제되었습니다')
      onOpenChange(false)
      onDeleted()
    } catch {
      toast.error('삭제에 실패했습니다')
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>청첩장 설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="border rounded-lg px-4 py-4">
            <SlugInput slug={slug} excludeId={invitationId} onChange={onSlugChange} />
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleDuplicate}
              disabled={duplicating}
            >
              {duplicating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}
              청첩장 복제
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  청첩장 삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>이 청첩장을 삭제할까요?</AlertDialogTitle>
                  <AlertDialogDescription>
                    삭제하면 되돌릴 수 없습니다. 갤러리 이미지와 방명록도 함께 사라집니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
