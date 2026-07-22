'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TemplateSelector } from '@/components/editor/template-selector'
import { SlugInput, type SlugStatus } from '@/components/editor/slug-input'
import { type TemplateType } from '@/lib/types'
import { createNewInvitation } from '@/lib/invitation-service'
import { toast } from 'sonner'

interface NewInvitationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  uid: string
  onCreated: (id: string) => void
}

export function NewInvitationDialog({ open, onOpenChange, uid, onCreated }: NewInvitationDialogProps) {
  const [template, setTemplate] = useState<TemplateType>('classic-elegant')
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [creating, setCreating] = useState(false)

  const canCreate = !creating && (slugStatus === 'idle' || slugStatus === 'available')

  const handleCreate = async () => {
    setCreating(true)
    try {
      const id = await createNewInvitation(uid, template, slug)
      onCreated(id)
      onOpenChange(false)
      setSlug('')
      setSlugStatus('idle')
    } catch {
      toast.error('청첩장 생성에 실패했습니다')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 청첩장 만들기</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <TemplateSelector selected={template} onSelect={setTemplate} />

          <div className="border rounded-lg px-4 py-4">
            <SlugInput slug={slug} onChange={setSlug} onStatusChange={setSlugStatus} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            취소
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate}>
            {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {creating ? '만드는 중...' : '만들기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
