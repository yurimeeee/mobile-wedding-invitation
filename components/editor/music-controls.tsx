'use client'

import { useRef } from 'react'
import { Music, Volume2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { type MusicSettings, musicTracks } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MusicControlsProps {
  settings: MusicSettings
  onChange: (settings: MusicSettings) => void
}

const CUSTOM_TRACK_ID = 'custom'

export function MusicControls({ settings, onChange }: MusicControlsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const isCustom = settings.track === CUSTOM_TRACK_ID

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('audio/')) {
      toast.error('오디오 파일만 업로드할 수 있어요')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('8MB 이하의 파일만 업로드할 수 있어요')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      onChange({ ...settings, track: CUSTOM_TRACK_ID, customUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-1">배경 음악</h3>
        <p className="text-sm text-muted-foreground">청첩장에 배경 음악을 추가하세요</p>
      </div>

      <div className="space-y-4 p-4 rounded-lg bg-muted/50">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="music-enabled">음악 활성화</Label>
          </div>
          <Switch
            id="music-enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Track selection */}
            <div className="space-y-2">
              <Label>트랙 선택</Label>
              <Select
                value={settings.track}
                onValueChange={(track) => onChange({ ...settings, track, ...(track !== CUSTOM_TRACK_ID && { customUrl: undefined }) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="트랙을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {musicTracks.map((track) => (
                    <SelectItem key={track.id} value={track.id}>
                      <div className="flex flex-col">
                        <span>{track.name}</span>
                        <span className="text-xs text-muted-foreground">{track.nameKr}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_TRACK_ID}>
                    <div className="flex flex-col">
                      <span>직접 업로드</span>
                      <span className="text-xs text-muted-foreground">내 파일에서 음악 선택</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {isCustom && (
                <div className="pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {settings.customUrl ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-background border border-border text-sm">
                      <span className="text-muted-foreground truncate">업로드된 음악 파일</span>
                      <button
                        type="button"
                        onClick={() => onChange({ ...settings, customUrl: undefined })}
                        className="text-muted-foreground hover:text-foreground shrink-0 ml-2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      음악 파일 업로드 (mp3, 8MB 이하)
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Auto play toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-play">열릴 때 자동 재생</Label>
              <Switch
                id="auto-play"
                checked={settings.autoPlay}
                onCheckedChange={(autoPlay) => onChange({ ...settings, autoPlay })}
              />
            </div>

            {/* Volume slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  볼륨
                </Label>
                <span className="text-sm text-muted-foreground">{settings.volume}%</span>
              </div>
              <Slider
                value={[settings.volume]}
                onValueChange={([volume]) => onChange({ ...settings, volume })}
                max={100}
                step={5}
              />
            </div>

            {/* Music player preview */}
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Music className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {isCustom ? '직접 업로드' : musicTracks.find(t => t.id === settings.track)?.name || '트랙을 선택하세요'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isCustom ? (settings.customUrl ? '업로드된 파일' : '파일을 업로드하세요') : musicTracks.find(t => t.id === settings.track)?.nameKr || '음악을 선택하세요'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-accent rounded-full animate-pulse"
                      style={{
                        height: `${8 + Math.random() * 12}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
