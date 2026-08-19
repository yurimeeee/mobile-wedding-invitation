'use client'

import { useRef } from 'react'
import { ImagePlus, MessageCircle, Link } from 'lucide-react'
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
import { SlugInput } from '@/components/editor/slug-input'
import { resizeImageToDataUrl } from '@/lib/image-resize'

// 카카오/OG 공유 카드 권장 크기(1200×630 근방)를 넉넉히 커버하는 정사각형 상한.
const SHARE_IMAGE_MAX_DIMENSION = 1200

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
    e.target.value = ''
    if (!file) return
    resizeImageToDataUrl(file, SHARE_IMAGE_MAX_DIMENSION).then(onImageSelect)
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
        <h3 className="font-medium mb-1">공유 & 캘린더</h3>
        <p className="text-sm text-muted-foreground">캘린더 등록과 공유 방식을 설정해 보세요.</p>
      </div>

      {/* URL 슬러그 */}
      <div className="border rounded-lg px-4 py-4">
        <SlugInput slug={slug} excludeId={invitationId} onChange={onSlugChange} />
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
