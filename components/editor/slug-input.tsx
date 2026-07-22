'use client'

import { useState, useEffect } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { checkSlugAvailable } from '@/lib/invitation-service'

const SLUG_REGEX = /^[a-z0-9-]+$/

export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'

interface SlugInputProps {
  slug: string
  onChange: (v: string) => void
  /** 현재 청첩장 자신의 id. 아직 생성 전이라면 비워두면 됩니다. */
  excludeId?: string
  onStatusChange?: (status: SlugStatus) => void
}

export function SlugInput({ slug, onChange, excludeId = '', onStatusChange }: SlugInputProps) {
  const [input, setInput] = useState(slug)
  const [status, setStatus] = useState<SlugStatus>('idle')
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const updateStatus = (next: SlugStatus) => {
    setStatus(next)
    onStatusChange?.(next)
  }

  useEffect(() => { setInput(slug) }, [slug])

  useEffect(() => {
    const trimmed = input.trim()
    if (!trimmed) { updateStatus('idle'); return }
    if (!SLUG_REGEX.test(trimmed) || trimmed.length < 2) { updateStatus('invalid'); return }

    updateStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const ok = await checkSlugAvailable(trimmed, excludeId)
        updateStatus(ok ? 'available' : 'taken')
        if (ok) onChange(trimmed)
      } catch {
        updateStatus('error')
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [input, excludeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const statusIcon = {
    checking: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    available: <Check className="h-4 w-4 text-green-500" />,
    taken: <X className="h-4 w-4 text-destructive" />,
    invalid: <X className="h-4 w-4 text-destructive" />,
    error: <X className="h-4 w-4 text-destructive" />,
    idle: null,
  }[status]

  const statusMsg = {
    checking: '',
    available: '사용 가능한 주소입니다',
    taken: '이미 사용 중인 주소입니다',
    invalid: '영문 소문자, 숫자, 하이픈(-)만 입력 가능합니다',
    error: '확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요',
    idle: '',
  }[status]

  return (
    <div className="space-y-2">
      <Label>청첩장 URL 주소</Label>
      <p className="text-xs text-muted-foreground">영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다</p>
      <div className="relative">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="my-wedding-2026"
          className="pr-8"
        />
        {statusIcon && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{statusIcon}</span>
        )}
      </div>
      {statusMsg && (
        <p className={`text-xs ${status === 'available' ? 'text-green-600' : 'text-destructive'}`}>
          {statusMsg}
        </p>
      )}
      {input && status === 'available' && (
        <p className="text-xs text-muted-foreground break-all">
          {origin}/invitation/<span className="font-medium text-foreground">{input}</span>
        </p>
      )}
      {!input && slug && (
        <p className="text-xs text-muted-foreground break-all">
          {origin}/invitation/<span className="font-medium text-foreground">{slug}</span>
        </p>
      )}
      {!input && !slug && (
        <p className="text-xs text-muted-foreground">미설정 시 자동 생성된 ID로 접근 가능합니다</p>
      )}
    </div>
  )
}
