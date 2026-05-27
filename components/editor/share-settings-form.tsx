'use client'

import { useRef, useState, useEffect } from 'react'
import { ImagePlus, MessageCircle, Link, Check, X, Loader2 } from 'lucide-react'
import { type ShareSettings, type CalendarSettings } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { checkSlugAvailable } from '@/lib/invitation-service'

interface ShareSettingsFormProps {
  shareSettings: ShareSettings
  calendarSettings: CalendarSettings
  onShareChange: (updates: Partial<ShareSettings>) => void
  onCalendarChange: (updates: Partial<CalendarSettings>) => void
  slug: string
  invitationId: string
  onSlugChange: (slug: string) => void
}

function ImageUploadBox({
  imageUrl,
  onImageSelect,
}: {
  imageUrl: string
  onImageSelect: (dataUrl: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onImageSelect(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="w-full aspect-square max-w-[200px] mx-auto rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted cursor-pointer flex items-center justify-center overflow-hidden transition-colors"
    >
      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png" hidden onChange={handleFile} />
      {imageUrl ? (
        <img src={imageUrl} alt="share thumbnail" className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImagePlus className="h-8 w-8" />
          <p className="text-xs text-center px-2">이미지 업로드<br />(권장 비율 1:1)</p>
        </div>
      )}
    </div>
  )
}

const SLUG_REGEX = /^[a-z0-9-]+$/

function SlugInput({ slug, invitationId, onChange }: { slug: string; invitationId: string; onChange: (v: string) => void }) {
  const [input, setInput] = useState(slug)
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => { setInput(slug) }, [slug])

  useEffect(() => {
    const trimmed = input.trim()
    if (!trimmed) { setStatus('idle'); return }
    if (!SLUG_REGEX.test(trimmed) || trimmed.length < 2) { setStatus('invalid'); return }

    setStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const ok = await checkSlugAvailable(trimmed, invitationId)
        setStatus(ok ? 'available' : 'taken')
        if (ok) onChange(trimmed)
      } catch {
        setStatus('idle')
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [input, invitationId]) // eslint-disable-line react-hooks/exhaustive-deps

  const statusIcon = {
    checking: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    available: <Check className="h-4 w-4 text-green-500" />,
    taken: <X className="h-4 w-4 text-destructive" />,
    invalid: <X className="h-4 w-4 text-destructive" />,
    idle: null,
  }[status]

  const statusMsg = {
    checking: '',
    available: '사용 가능한 주소입니다',
    taken: '이미 사용 중인 주소입니다',
    invalid: '영문 소문자, 숫자, 하이픈(-)만 입력 가능합니다',
    idle: '',
  }[status]

  return (
    <div className="space-y-2">
      <Label>청첩장 URL 주소</Label>
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

export function ShareSettingsForm({
  shareSettings,
  calendarSettings,
  onShareChange,
  onCalendarChange,
  slug,
  invitationId,
  onSlugChange,
}: ShareSettingsFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-1">공유 및 표시 설정</h3>
        <p className="text-sm text-muted-foreground">캘린더 표시와 공유 정보를 설정하세요</p>
      </div>

      {/* URL 슬러그 */}
      <div className="border rounded-lg px-4 py-4">
        <SlugInput slug={slug} invitationId={invitationId} onChange={onSlugChange} />
      </div>

      <Accordion type="multiple" defaultValue={['calendar', 'kakao', 'link']} className="space-y-2">
        {/* 캘린더 설정 */}
        <AccordionItem value="calendar" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span>캘린더 표시 설정</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
              <Label>캘린더 표시</Label>
              <Switch
                checked={calendarSettings.calendarDisplay}
                onCheckedChange={(v) => onCalendarChange({ calendarDisplay: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>카운트다운 표시</Label>
              <Switch
                checked={calendarSettings.countdownDisplay}
                onCheckedChange={(v) => onCalendarChange({ countdownDisplay: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>D-Day 표시</Label>
              <Switch
                checked={calendarSettings.dDayDisplay}
                onCheckedChange={(v) => onCalendarChange({ dDayDisplay: v })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 카카오톡 공유 설정 */}
        <AccordionItem value="kakao" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#FFEB00] fill-[#3B1E1E]" />
              <span>카카오톡 공유 설정</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>공유 썸네일 이미지</Label>
              <ImageUploadBox
                imageUrl={shareSettings.kakaoImg}
                onImageSelect={(url) => onShareChange({ kakaoImg: url })}
              />
            </div>
            <div className="space-y-2">
              <Label>공유 제목</Label>
              <Input
                value={shareSettings.kakaoTitle}
                onChange={(e) => onShareChange({ kakaoTitle: e.target.value })}
                placeholder="제목을 입력하세요 (미입력 시 이름으로 자동 설정)"
              />
            </div>
            <div className="space-y-2">
              <Label>공유 설명</Label>
              <Input
                value={shareSettings.kakaoDesc}
                onChange={(e) => onShareChange({ kakaoDesc: e.target.value })}
                placeholder="설명을 입력하세요 (미입력 시 자동 설정)"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              * 카카오 개발자 콘솔에서 앱 등록 후 사용 가능합니다
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 링크 공유 설정 */}
        <AccordionItem value="link" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-[#7499CB]" />
              <span>링크 공유 설정 (OG 메타)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label>OG 이미지</Label>
              <ImageUploadBox
                imageUrl={shareSettings.linkImg}
                onImageSelect={(url) => onShareChange({ linkImg: url })}
              />
            </div>
            <div className="space-y-2">
              <Label>OG 제목</Label>
              <Input
                value={shareSettings.linkTitle}
                onChange={(e) => onShareChange({ linkTitle: e.target.value })}
                placeholder="링크 미리보기 제목"
              />
            </div>
            <div className="space-y-2">
              <Label>OG 설명</Label>
              <Input
                value={shareSettings.linkDesc}
                onChange={(e) => onShareChange({ linkDesc: e.target.value })}
                placeholder="링크 미리보기 설명"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
