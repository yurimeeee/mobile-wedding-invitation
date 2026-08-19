// 결혼식 일정을 하객의 캘린더 앱(구글 캘린더/애플 캘린더 등)에 저장할 수 있도록
// RFC 5545 iCalendar(.ics) 파일을 만들어 다운로드시킨다.
export interface WeddingCalendarEvent {
  title: string
  date: string // 'YYYY-MM-DD'
  time: string // 'HH:mm'
  location?: string
  description?: string
}

const DEFAULT_DURATION_HOURS = 2

// 예식장 시각은 항상 한국 표준시(KST, UTC+9) 기준이라고 가정하고 UTC로 환산한다.
function toIcsUtcString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
}

function kstToUtcDate(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number)
  return new Date(Date.UTC(y, m - 1, d, hh - 9, mm))
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function downloadWeddingIcs(event: WeddingCalendarEvent) {
  if (!event.date) return

  const start = kstToUtcDate(event.date, event.time)
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000)
  const uid = `wedding-${event.date}-${Date.now()}@wedding-invitation-builder`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Invitation Builder//KO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtcString(new Date())}`,
    `DTSTART:${toIcsUtcString(start)}`,
    `DTEND:${toIcsUtcString(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    event.location && `LOCATION:${escapeIcsText(event.location)}`,
    event.description && `DESCRIPTION:${escapeIcsText(event.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((line): line is string => Boolean(line))

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'wedding.ics'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
