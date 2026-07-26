'use client'

import { useState } from 'react'
import { ArrowLeft, Loader2, Palette, Wand2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TemplateSelector } from '@/components/editor/template-selector'
import { SlugInput, type SlugStatus } from '@/components/editor/slug-input'
import { type EditorMode, type TemplateType } from '@/lib/types'
import { createNewInvitation } from '@/lib/invitation-service'
import { toast } from 'sonner'

interface NewInvitationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  uid: string
  onCreated: (id: string, mode: EditorMode) => void
}

type Step = 'choice' | 'setup'

const modeOptions: { id: EditorMode; icon: typeof Palette; title: string; description: string }[] = [
  {
    id: 'template',
    icon: Palette,
    title: '추천 템플릿 선택',
    description: '미리 디자인된 템플릿 중 하나를 골라 빠르게 시작해요.',
  },
  {
    id: 'custom',
    icon: Wand2,
    title: '자유 커스텀 에디터로 시작하기',
    description: '섹션 순서, 스티커, 배경색까지 처음부터 직접 구성해요.',
  },
]

export function NewInvitationDialog({ open, onOpenChange, uid, onCreated }: NewInvitationDialogProps) {
  const [step, setStep] = useState<Step>('choice')
  const [mode, setMode] = useState<EditorMode>('template')
  const [template, setTemplate] = useState<TemplateType>('classic-elegant')
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [creating, setCreating] = useState(false)

  const canCreate = !creating && (slugStatus === 'idle' || slugStatus === 'available')

  const reset = () => {
    setStep('choice')
    setMode('template')
    setSlug('')
    setSlugStatus('idle')
  }

  const handleChooseMode = (chosen: EditorMode) => {
    setMode(chosen)
    setStep('setup')
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const id = await createNewInvitation(uid, template, slug, mode)
      onCreated(id, mode)
      onOpenChange(false)
      reset()
    } catch {
      toast.error('청첩장 생성에 실패했습니다')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) reset() }}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 청첩장 만들기</DialogTitle>
        </DialogHeader>

        {step === 'choice' ? (
          <div className="space-y-3 py-2">
            {modeOptions.map((option) => (
              <motion.button
                key={option.id}
                onClick={() => handleChooseMode(option.id)}
                className="w-full flex items-start gap-4 rounded-lg border-2 border-border hover:border-accent/50 p-4 text-left transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <option.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">{option.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-6 py-2">
            <button
              type="button"
              onClick={() => setStep('choice')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로
            </button>

            <div>
              {mode === 'custom' && (
                <p className="text-sm text-muted-foreground mb-3">
                  커스텀 에디터에서도 색감과 톤의 기준이 되는 스타일이에요. 나중에 언제든 바꿀 수 있어요.
                </p>
              )}
              <TemplateSelector selected={template} onSelect={setTemplate} />
            </div>

            <div className="border rounded-lg px-4 py-4">
              <SlugInput slug={slug} onChange={setSlug} onStatusChange={setSlugStatus} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            취소
          </Button>
          {step === 'setup' && (
            <Button onClick={handleCreate} disabled={!canCreate}>
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {creating ? '만드는 중...' : '만들기'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
