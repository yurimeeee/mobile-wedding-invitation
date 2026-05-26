'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { type CalendarSettings } from '@/lib/types'

interface WeddingCalendarProps {
  weddingDate: string  // 'YYYY-MM-DD'
  weddingTime: string  // 'HH:mm'
  settings: CalendarSettings
  isDark?: boolean
}

function formatKoreanTime(timeStr: string) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const pm = h >= 12
  const hour = h % 12 || 12
  return m > 0 ? `${pm ? '오후' : '오전'} ${hour}시 ${m}분` : `${pm ? '오후' : '오전'} ${hour}시`
}

// ─── Custom Calendar Grid ────────────────────────────────────────────────────
function CalendarGrid({ wedding, isDark }: { wedding: Date; isDark?: boolean }) {
  const year = wedding.getFullYear()
  const month = wedding.getMonth()
  const targetDay = wedding.getDate()

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay() // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (number | null)[] = Array(firstDay).fill(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [year, month])

  const weekDays = ['일', '월', '화', '수', '목', '금', '토']
  const monthLabel = format(wedding, 'yyyy년 M월', { locale: ko })

  const textBase = isDark ? 'text-gray-300' : 'text-gray-700'
  const mutedText = isDark ? 'text-gray-500' : 'text-gray-400'
  const divider = isDark ? 'border-white/10' : 'border-gray-100'

  return (
    <div className="w-full">
      {/* Month label */}
      <p className={`text-center text-sm font-medium mb-3 tracking-widest ${textBase}`}>
        {monthLabel}
      </p>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((d, i) => (
          <p
            key={d}
            className={`text-center text-[11px] font-medium py-1
              ${i === 0 ? 'text-[#c47a85]' : i === 6 ? (isDark ? 'text-blue-300' : 'text-blue-400') : mutedText}`}
          >
            {d}
          </p>
        ))}
      </div>

      <div className={`border-t ${divider} mb-2`} />

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, i) => {
          const col = i % 7
          const isSun = col === 0
          const isSat = col === 6
          const isTarget = day === targetDay

          let textColor = textBase
          if (isSun) textColor = 'text-[#c47a85]'
          else if (isSat) textColor = isDark ? 'text-blue-300' : 'text-blue-400'

          return (
            <div key={i} className="flex items-center justify-center py-0.5">
              {day ? (
                isTarget ? (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: '#F3D5D9' }}>
                    <span className="text-[12px] font-bold" style={{ color: '#7a3d44' }}>{day}</span>
                  </div>
                ) : (
                  <span className={`text-[12px] w-7 h-7 flex items-center justify-center ${textColor}`}>
                    {day}
                  </span>
                )
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Countdown ───────────────────────────────────────────────────────────────
function Countdown({ target, isDark }: { target: Date; isDark?: boolean }) {
  const calc = () => {
    const diff = target.getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    const s = Math.floor(diff / 1000)
    return {
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
    }
  }

  const [time, setTime] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps

  const items: [string, number][] = [
    ['days', time.days],
    ['hours', time.hours],
    ['minutes', time.minutes],
    ['seconds', time.seconds],
  ]

  const borderCls = isDark ? 'border-white/15' : 'border-gray-200'
  const numCls = isDark ? 'text-white' : 'text-gray-800'
  const labelCls = isDark ? 'text-gray-500' : 'text-gray-400'
  const dividerCls = isDark ? 'text-gray-600' : 'text-gray-200'

  return (
    <div className={`flex items-stretch w-full rounded-xl border ${borderCls} overflow-hidden`}>
      {items.map(([label, val], i) => (
        <div key={label} className="flex-1 flex flex-col items-center justify-center py-3 relative">
          {i > 0 && (
            <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-xs ${dividerCls}`}>·</span>
          )}
          <span className={`text-lg font-light tabular-nums tracking-tight ${numCls}`}>
            {String(val).padStart(2, '0')}
          </span>
          <span className={`text-[10px] mt-0.5 tracking-widest uppercase ${labelCls}`}>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── D-Day ───────────────────────────────────────────────────────────────────
function DDay({ target, isDark }: { target: Date; isDark?: boolean }) {
  const diff = Math.ceil((target.getTime() - Date.now()) / 86400000)
  const accentCls = isDark ? 'text-pink-300' : 'text-[#c47a85]'
  const textCls = isDark ? 'text-gray-300' : 'text-gray-600'

  return (
    <p className={`text-center text-sm ${textCls}`}>
      결혼식이{' '}
      {diff > 0
        ? <><span className={`font-semibold ${accentCls}`}>D - {diff}</span></>
        : diff === 0
        ? <span className={`font-semibold ${accentCls}`}>D - Day</span>
        : <><span className={`font-semibold ${accentCls}`}>D + {Math.abs(diff)}</span></>
      }
    </p>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export function WeddingCalendar({ weddingDate, weddingTime, settings, isDark }: WeddingCalendarProps) {
  const wedding = weddingDate && !isNaN(new Date(weddingDate).getTime())
    ? new Date(weddingDate)
    : new Date()

  const textCls = isDark ? 'text-gray-300' : 'text-gray-600'
  const subTextCls = isDark ? 'text-gray-500' : 'text-gray-400'

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Date & time headline */}
      <div className="text-center space-y-0.5">
        <p className={`text-sm font-medium ${textCls}`}>
          {format(wedding, 'yyyy년 M월 d일 EEEE', { locale: ko })}
        </p>
        {weddingTime && (
          <p className={`text-xs ${subTextCls}`}>{formatKoreanTime(weddingTime)}</p>
        )}
      </div>

      {settings.calendarDisplay && (
        <CalendarGrid wedding={wedding} isDark={isDark} />
      )}

      {settings.countdownDisplay && <Countdown target={wedding} isDark={isDark} />}
      {settings.dDayDisplay && <DDay target={wedding} isDark={isDark} />}
    </div>
  )
}
