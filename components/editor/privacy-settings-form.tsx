'use client'

import { useState } from 'react'
import { Lock, ZoomIn, Eye, EyeOff, CalendarOff } from 'lucide-react'
import { AUTO_EXPIRE_DAYS, type PrivacySettings } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface PrivacySettingsFormProps {
  privacySettings: PrivacySettings
  onChange: (updates: Partial<PrivacySettings>) => void
  weddingDate?: string
}

export function PrivacySettingsForm({ privacySettings, onChange, weddingDate }: PrivacySettingsFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-6">
      {/* 청첩장 잠금 설정 */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold mb-1">청첩장 잠금</h3>
          <p className="text-xs text-muted-foreground">원하는 시점에 청첩장을 비공개할 수 있어요.</p>
        </div>
        <div className="space-y-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="lock-enabled">잠금 활성화</Label>
            </div>
            <Switch
              id="lock-enabled"
              checked={privacySettings.lockEnabled}
              onCheckedChange={(lockEnabled) => onChange({ lockEnabled })}
            />
          </div>

          {privacySettings.lockEnabled && (
            <div className="space-y-2">
              <Label htmlFor="lock-password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="lock-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="4자리 이상 입력하세요"
                  className="pr-10"
                  value={privacySettings.lockPassword}
                  onChange={(e) => onChange({ lockPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <ul className="text-xs text-muted-foreground space-y-1 pt-1">
            <li>· 보안성과 프라이버시 확보</li>
            <li>· 비밀번호 입력시에만 열람 가능</li>
            <li>· 언제든지 잠금 설정/해제 가능</li>
          </ul>
        </div>
      </div>

      {/* 확대방지 */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold mb-1">확대방지</h3>
          <p className="text-xs text-muted-foreground">사진을 확대할 수 없도록 설정 가능해요.</p>
        </div>
        <div className="space-y-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="zoom-prevention">확대방지 활성화</Label>
            </div>
            <Switch
              id="zoom-prevention"
              checked={privacySettings.zoomPrevention}
              onCheckedChange={(zoomPrevention) => onChange({ zoomPrevention })}
            />
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 pt-1">
            <li>· 핀치 줌 확대 방지</li>
            <li>· 청첩장 내 모든사진 확대 방지</li>
          </ul>
        </div>
      </div>

      {/* 자동 만료 */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold mb-1">자동 만료</h3>
          <p className="text-xs text-muted-foreground">결혼식 이후 자동으로 비공개 전환할 수 있어요.</p>
        </div>
        <div className="space-y-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarOff className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="auto-expire">자동 만료 활성화</Label>
            </div>
            <Switch
              id="auto-expire"
              checked={privacySettings.autoExpireEnabled}
              onCheckedChange={(autoExpireEnabled) => onChange({ autoExpireEnabled })}
            />
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 pt-1">
            {privacySettings.autoExpireEnabled && !weddingDate && (
              <li>· 예식 정보 탭에서 결혼식 날짜를 입력해야 적용돼요</li>
            )}
            <li>· 결혼식 {AUTO_EXPIRE_DAYS}일 후 자동으로 비공개 전환돼요</li>
            <li>· 언제든 이 설정을 꺼서 다시 공개할 수 있어요</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
