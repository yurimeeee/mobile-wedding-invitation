'use client'

import { useState } from 'react'
import { format, parse, isValid } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon, Clock } from 'lucide-react'
import { DayPicker, type DayButtonProps } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Date Picker ─────────────────────────────────────────────────────────────

interface DatePickerProps {
  value: string        // 'YYYY-MM-DD'
  onChange: (v: string) => void
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const validSelected = selected && isValid(selected) ? selected : undefined

  const label = validSelected
    ? format(validSelected, 'yyyy년 M월 d일 (EEE)', { locale: ko })
    : '날짜 선택'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-10 px-3',
            !validSelected && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="single"
          selected={validSelected}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, 'yyyy-MM-dd'))
              setOpen(false)
            }
          }}
          locale={ko}
          captionLayout="dropdown"
          fromYear={2024}
          toYear={2030}
          classNames={{
            root: 'p-3',
            months: 'flex flex-col',
            month: 'flex flex-col gap-3',
            nav: 'flex items-center gap-1 absolute top-3 inset-x-3 justify-between',
            button_previous:
              'h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground',
            button_next:
              'h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground',
            month_caption: 'flex justify-center h-7 items-center px-8',
            dropdowns: 'flex gap-1 text-sm font-medium',
            dropdown_root:
              'relative border border-input rounded-md',
            dropdown: 'absolute inset-0 opacity-0 cursor-pointer',
            caption_label:
              'text-sm font-medium px-2 py-1 rounded-md flex items-center gap-1',
            weekdays: 'flex',
            weekday:
              'text-muted-foreground text-center text-[11px] font-medium w-9 py-1 select-none',
            week: 'flex mt-1',
            day: 'w-9 h-9 p-0 text-center',
            outside: '[&_button]:opacity-30',
            disabled: '[&_button]:opacity-30 [&_button]:pointer-events-none',
            today: '[&_button]:underline [&_button]:font-semibold',
          }}
          components={{
            DayButton: ({ day, modifiers, className, ...props }: DayButtonProps) => (
              <button
                {...props}
                className={cn(
                  'w-9 h-9 rounded-full text-sm transition-colors',
                  modifiers.selected
                    ? 'bg-[#F3D5D9] text-[#7a3d44] font-semibold'
                    : 'hover:bg-muted text-foreground',
                )}
              />
            ),
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

// ─── Time Picker ─────────────────────────────────────────────────────────────

interface TimePickerProps {
  value: string        // 'HH:mm' (24h)
  onChange: (v: string) => void
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)   // 1~12
const MINUTES = [0, 10, 20, 30, 40, 50]

function parseTime(v: string): { ampm: 'am' | 'pm'; hour: number; minute: number } {
  if (!v) return { ampm: 'am', hour: 10, minute: 0 }
  const [h, m] = v.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return { ampm, hour, minute: m ?? 0 }
}

function toTime24(ampm: 'am' | 'pm', hour: number, minute: number): string {
  let h = hour % 12
  if (ampm === 'pm') h += 12
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const { ampm, hour, minute } = parseTime(value)

  const label = value
    ? `${ampm === 'am' ? '오전' : '오후'} ${hour}시${minute > 0 ? ` ${minute}분` : ''}`
    : '시간 선택'

  const set = (patch: Partial<{ ampm: 'am' | 'pm'; hour: number; minute: number }>) => {
    const next = { ampm, hour, minute, ...patch }
    onChange(toTime24(next.ampm, next.hour, next.minute))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-10 px-3',
            !value && 'text-muted-foreground',
          )}
        >
          <Clock className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
          <span>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="space-y-4">
          {/* AM / PM */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['am', 'pm'] as const).map((a) => (
              <button
                key={a}
                onClick={() => set({ ampm: a })}
                className={cn(
                  'flex-1 py-2 text-sm font-medium transition-colors',
                  ampm === a
                    ? 'bg-[#F3D5D9] text-[#7a3d44]'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {a === 'am' ? '오전' : '오후'}
              </button>
            ))}
          </div>

          {/* Hour */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-2 tracking-wider">시</p>
            <div className="grid grid-cols-6 gap-1">
              {HOURS.map((h) => (
                <button
                  key={h}
                  onClick={() => set({ hour: h })}
                  className={cn(
                    'h-8 rounded-md text-sm transition-colors',
                    hour === h
                      ? 'bg-[#F3D5D9] text-[#7a3d44] font-semibold'
                      : 'hover:bg-muted text-foreground',
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Minute */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-2 tracking-wider">분</p>
            <div className="grid grid-cols-6 gap-1">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    set({ minute: m })
                    setOpen(false)
                  }}
                  className={cn(
                    'h-8 rounded-md text-sm transition-colors',
                    minute === m
                      ? 'bg-[#F3D5D9] text-[#7a3d44] font-semibold'
                      : 'hover:bg-muted text-foreground',
                  )}
                >
                  {String(m).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
