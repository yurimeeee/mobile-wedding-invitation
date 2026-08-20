'use client'

import { useState } from 'react'
import { CheckCircle2, ClipboardCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { submitRSVP, type RSVPSide } from '@/lib/rsvp-service'

interface RSVPSectionProps {
  invitationId: string
  textStyle: React.CSSProperties
  mutedStyle: React.CSSProperties
  sectionBg: string
  accentColor: string
  lovely?: boolean
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
        active ? 'border-transparent text-white' : lovely ? 'border-[#EBD8DC]' : 'border-border'
      )}
      style={active ? { background: accentColor } : textStyle}
    >
      {children}
    </button>
  )
}

export function RSVPSection({ invitationId, textStyle, mutedStyle, sectionBg, accentColor, lovely }: RSVPSectionProps) {
  const [name, setName] = useState('')
  const [side, setSide] = useState<RSVPSide | null>(null)
  const [attending, setAttending] = useState<boolean | null>(null)
  const [guestCount, setGuestCount] = useState('1')
  const [mealAttending, setMealAttending] = useState<boolean | null>(null)
  const [companions, setCompanions] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return toast('성함을 입력해주세요')
    if (!side) return toast('신랑측/신부측을 선택해주세요')
    if (attending === null) return toast('참석 여부를 선택해주세요')

    setIsSubmitting(true)
    try {
      await submitRSVP(invitationId, {
        name: name.trim(),
        side,
        attending,
        guestCount: attending ? Math.max(1, Math.round(Number(guestCount) || 1)) : 0,
        mealAttending: attending ? mealAttending ?? false : false,
        companions: attending ? companions.trim() : '',
        phone: phone.trim(),
      })
      setSubmitted(true)
      toast.success('참석여부가 전달되었습니다')
    } catch (e) {
      console.error('[rsvp] submit error:', e)
      toast.error('전달에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const cardStyle = lovely
    ? { background: '#FFFFFF', borderRadius: 24, boxShadow: '0 10px 24px rgba(91,74,78,0.08)' }
    : { background: sectionBg }
  const fieldClass = lovely ? 'rounded-full border-0 bg-[#FDF1F3]' : undefined

  if (submitted) {
    return (
      <div className="mb-10">
        <div className="rounded-lg p-6 flex flex-col items-center gap-2 text-center" style={cardStyle}>
          <CheckCircle2 className="h-6 w-6" style={{ color: accentColor }} />
          <p className="text-sm font-medium" style={textStyle}>참석여부가 전달되었습니다</p>
          <p className="text-xs" style={mutedStyle}>소중한 걸음, 미리 알려주셔서 감사합니다</p>
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

        <Button onClick={handleSubmit} disabled={isSubmitting} className={cn('w-full', lovely && 'rounded-full')} style={{ background: accentColor }}>
          참석여부 전달하기
        </Button>
      </div>
    </div>
  )
}
