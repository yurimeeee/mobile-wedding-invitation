'use client'

import { useState } from 'react'
import { CalendarOff, CheckCircle2, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { submitRSVP, updateRSVP, type MealOption, type RSVPFormData, type RSVPSide } from '@/lib/rsvp-service'
import type { RSVPSettings } from '@/lib/types'

interface RSVPSectionProps {
  invitationId: string
  textStyle: React.CSSProperties
  mutedStyle: React.CSSProperties
  sectionBg: string
  accentColor: string
  lovely?: boolean
  rsvpSettings: RSVPSettings
}

interface SavedRSVP extends RSVPFormData {
  rsvpId: string
  editToken: string
}

function storageKey(invitationId: string): string {
  return `rsvp:${invitationId}`
}

// 새로고침해도 폼이 다시 비어 보여서 모르고 중복 제출하는 걸 막기 위해, 제출/수정에
// 성공한 응답을 이 기기의 localStorage에 남겨둔다. 프라이빗 브라우징 등에서 접근이
// 막혀 있어도 참석여부 전달 자체는 계속돼야 하므로 읽기/쓰기 모두 조용히 실패를 무시한다.
function readSavedRSVP(invitationId: string): SavedRSVP | null {
  try {
    const raw = localStorage.getItem(storageKey(invitationId))
    return raw ? (JSON.parse(raw) as SavedRSVP) : null
  } catch {
    return null
  }
}

function writeSavedRSVP(invitationId: string, saved: SavedRSVP) {
  try {
    localStorage.setItem(storageKey(invitationId), JSON.stringify(saved))
  } catch {
    // ignore — 로컬 기록이 안 남아도 제출은 이미 서버에 성공적으로 반영됐다
  }
}

function ToggleButton({
  active,
  onClick,
  accentColor,
  textStyle,
  lovely,
  children,
}: {
  active: boolean
  onClick: () => void
  accentColor: string
  textStyle: React.CSSProperties
  lovely?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 border py-2 text-sm font-medium transition-colors',
        lovely ? 'rounded-full' : 'rounded-md',
        active ? 'border-transparent text-white' : lovely ? 'border-[#E4CDD1]' : 'border-border'
      )}
      style={active ? { background: accentColor } : textStyle}
    >
      {children}
    </button>
  )
}

export function RSVPSection({ invitationId, textStyle, mutedStyle, sectionBg, accentColor, lovely, rsvpSettings }: RSVPSectionProps) {
  const [saved, setSaved] = useState<SavedRSVP | null>(() => readSavedRSVP(invitationId))
  const [isEditing, setIsEditing] = useState(false)

  const [name, setName] = useState(saved?.name ?? '')
  const [side, setSide] = useState<RSVPSide | null>(saved?.side ?? null)
  const [attending, setAttending] = useState<boolean | null>(saved?.attending ?? null)
  const [guestCount, setGuestCount] = useState(saved ? String(saved.guestCount) : '1')
  const [mealAttending, setMealAttending] = useState<boolean | null>(saved?.mealAttending ?? null)
  const [mealOption, setMealOption] = useState<MealOption | null>(saved?.mealOption ?? null)
  const [companions, setCompanions] = useState(saved?.companions ?? '')
  const [phone, setPhone] = useState(saved?.phone ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return toast('성함을 입력해주세요')
    if (!side) return toast('신랑측/신부측을 선택해주세요')
    if (attending === null) return toast('참석 여부를 선택해주세요')
    if (attending && mealAttending === true && !mealOption) return toast('식사 메뉴를 선택해주세요')

    const data: RSVPFormData = {
      name: name.trim(),
      side,
      attending,
      guestCount: attending ? Math.max(1, Math.round(Number(guestCount) || 1)) : 0,
      mealAttending: attending ? mealAttending ?? false : false,
      mealOption: attending && mealAttending ? mealOption : null,
      companions: attending ? companions.trim() : '',
      phone: phone.trim(),
    }

    setIsSubmitting(true)
    try {
      if (saved) {
        await updateRSVP(invitationId, saved.rsvpId, saved.editToken, data)
        const next: SavedRSVP = { ...data, rsvpId: saved.rsvpId, editToken: saved.editToken }
        writeSavedRSVP(invitationId, next)
        setSaved(next)
        toast.success('참석여부가 수정되었습니다')
      } else {
        const { rsvpId, editToken } = await submitRSVP(invitationId, data)
        const next: SavedRSVP = { ...data, rsvpId, editToken }
        writeSavedRSVP(invitationId, next)
        setSaved(next)
        toast.success('참석여부가 전달되었습니다')
      }
      setIsEditing(false)
    } catch (e) {
      console.error('[rsvp] submit error:', e)
      toast.error(e instanceof Error ? e.message : '전달에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const cardStyle = lovely
    ? { background: '#FFFFFF', borderRadius: 24, boxShadow: '0 10px 24px rgba(74,63,63,0.08)' }
    : { background: sectionBg }
  const fieldClass = lovely ? 'rounded-full border-0 bg-[#F5E9EA]' : undefined

  if (!rsvpSettings.enabled) return null

  const isPastDeadline = !!rsvpSettings.deadline && new Date() > new Date(`${rsvpSettings.deadline}T23:59:59`)

  if (saved && !isEditing) {
    return (
      <div className="mb-10">
        <div className="rounded-lg p-6 flex flex-col items-center gap-3 text-center" style={cardStyle}>
          <CheckCircle2 className="h-6 w-6" style={{ color: accentColor }} />
          <div>
            <p className="text-sm font-medium" style={textStyle}>전달하신 참석여부</p>
            <p className="text-xs mt-1" style={mutedStyle}>
              {saved.name}님 · {saved.side === 'groom' ? '신랑측' : '신부측'} ·{' '}
              {saved.attending ? `참석 (${saved.guestCount}명)` : '불참'}
              {saved.attending && saved.mealOption && ` · ${saved.mealOption === 'korean' ? '한식' : '양식'}`}
            </p>
          </div>
          {!isPastDeadline && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className={cn(lovely && 'rounded-full')}
            >
              수정하기
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!saved && isPastDeadline) {
    return (
      <div className="mb-10">
        <div className="rounded-lg p-6 flex flex-col items-center gap-2 text-center" style={cardStyle}>
          <CalendarOff className="h-6 w-6" style={mutedStyle} />
          <p className="text-sm font-medium" style={textStyle}>참석여부 전달이 마감되었습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardCheck className="h-4 w-4" style={mutedStyle} />
        <h2 className="text-sm font-medium" style={textStyle}>참석여부 전달</h2>
      </div>

      <div className="rounded-lg p-4 space-y-3" style={cardStyle}>
        <Input
          placeholder="성함"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />

        <div className="flex gap-2">
          <ToggleButton active={side === 'groom'} onClick={() => setSide('groom')} accentColor={accentColor} textStyle={textStyle} lovely={lovely}>
            신랑측
          </ToggleButton>
          <ToggleButton active={side === 'bride'} onClick={() => setSide('bride')} accentColor={accentColor} textStyle={textStyle} lovely={lovely}>
            신부측
          </ToggleButton>
        </div>

        <div className="flex gap-2">
          <ToggleButton active={attending === true} onClick={() => setAttending(true)} accentColor={accentColor} textStyle={textStyle} lovely={lovely}>
            참석
          </ToggleButton>
          <ToggleButton active={attending === false} onClick={() => setAttending(false)} accentColor={accentColor} textStyle={textStyle} lovely={lovely}>
            불참
          </ToggleButton>
        </div>

        {attending === true && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm shrink-0" style={mutedStyle}>참석 인원</label>
              <Input
                type="number"
                min={1}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className={cn('w-20', fieldClass)}
              />
              <span className="text-sm" style={mutedStyle}>명</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm" style={mutedStyle}>예식 식사 참석 여부</label>
              <div className="flex gap-2">
                <ToggleButton active={mealAttending === true} onClick={() => setMealAttending(true)} accentColor={accentColor} textStyle={textStyle} lovely={lovely}>
                  식사 참석
                </ToggleButton>
                <ToggleButton active={mealAttending === false} onClick={() => setMealAttending(false)} accentColor={accentColor} textStyle={textStyle} lovely={lovely}>
                  식사 안함
                </ToggleButton>
              </div>
            </div>

            {mealAttending === true && (
              <div className="space-y-1.5">
                <label className="text-sm" style={mutedStyle}>식사 메뉴</label>
                <div className="flex gap-2">
                  <ToggleButton active={mealOption === 'korean'} onClick={() => setMealOption('korean')} accentColor={accentColor} textStyle={textStyle} lovely={lovely}>
                    한식
                  </ToggleButton>
                  <ToggleButton active={mealOption === 'western'} onClick={() => setMealOption('western')} accentColor={accentColor} textStyle={textStyle} lovely={lovely}>
                    양식
                  </ToggleButton>
                </div>
              </div>
            )}

            <Input
              placeholder="동반인 성함 (있는 경우, 쉼표로 구분)"
              value={companions}
              onChange={(e) => setCompanions(e.target.value)}
              className={fieldClass}
            />
          </>
        )}

        <Input
          type="tel"
          placeholder="연락처 (선택)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={fieldClass}
        />

        <div className="flex gap-2">
          {isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
              className={cn('flex-1', lovely && 'rounded-full')}
            >
              취소
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn('flex-1', lovely && 'rounded-full')}
            style={{ background: accentColor }}
          >
            {isEditing ? '수정 완료' : '참석여부 전달하기'}
          </Button>
        </div>
      </div>
    </div>
  )
}
