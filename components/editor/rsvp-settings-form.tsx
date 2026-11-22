'use client'

import { ClipboardCheck, Users } from 'lucide-react'
import { type RSVPSettings } from '@/lib/types'
import { DatePicker } from '@/components/editor/date-time-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface RSVPSettingsFormProps {
  rsvpSettings: RSVPSettings
  onChange: (updates: Partial<RSVPSettings>) => void
}

export function RSVPSettingsForm({ rsvpSettings, onChange }: RSVPSettingsFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold mb-1">참석여부 받기</h3>
          <p className="text-xs text-muted-foreground">하객이 참석여부를 전달할 수 있도록 설정해요.</p>
        </div>
        <div className="space-y-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="rsvp-enabled">참석여부 받기 활성화</Label>
            </div>
            <Switch
              id="rsvp-enabled"
              checked={rsvpSettings.enabled}
              onCheckedChange={(enabled) => onChange({ enabled })}
            />
          </div>

          {rsvpSettings.enabled && (
            <>
              <div className="space-y-2">
                <Label>마감일</Label>
                <DatePicker value={rsvpSettings.deadline} onChange={(deadline) => onChange({ deadline })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rsvp-max-guests" className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  최대 인원
                </Label>
                <Input
                  id="rsvp-max-guests"
                  type="number"
                  min={0}
                  value={rsvpSettings.maxGuests}
                  onChange={(e) => onChange({ maxGuests: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                />
              </div>
            </>
          )}

          <ul className="text-xs text-muted-foreground space-y-1 pt-1">
            <li>· 마감일이 지나면 하객의 참석여부 전달이 자동으로 중단돼요</li>
            <li>· 참석 인원 합계가 최대 인원을 넘으면 더 이상 받지 않아요</li>
            <li>· 언제든 다시 활성화하거나 마감일을 조정할 수 있어요</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
