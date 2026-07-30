import { NextResponse, type NextRequest } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAdminRequest } from '@/lib/admin-api-auth'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
// 월~일 순서로 보여주기 위한 표시 순서(getDay()는 일요일=0 기준이라 그대로 쓰면 순서가 어긋난다)
const WEEKDAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const snapshot = await adminDb.collection('invitations').get()
  const docs = snapshot.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    return {
      id: d.id,
      title: data.title,
      status: data.status,
      mode: data.mode,
      createdAt: data.createdAt,
      viewCount: typeof data.viewCount === 'number' ? data.viewCount : 0,
    }
  })

  const totalCreated = docs.length

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  let thisMonthCount = 0
  let lastMonthCount = 0

  const weekdayCounts = new Map<number, number>(WEEKDAY_DISPLAY_ORDER.map((d) => [d, 0]))
  let publishedCount = 0
  let templateModeCount = 0
  let customModeCount = 0
  let totalViews = 0

  for (const d of docs) {
    const createdAt = toDate(d.createdAt)
    if (createdAt) {
      if (createdAt >= thisMonthStart) thisMonthCount++
      else if (createdAt >= lastMonthStart) lastMonthCount++
      weekdayCounts.set(createdAt.getDay(), (weekdayCounts.get(createdAt.getDay()) ?? 0) + 1)
    }
    if (d.status === 'published') publishedCount++
    if (d.mode === 'custom') customModeCount++
    else templateModeCount++
    totalViews += d.viewCount
  }

  const totalCreatedGrowthPct =
    lastMonthCount === 0 ? null : Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)

  const creationByDay = WEEKDAY_DISPLAY_ORDER.map((dayIndex) => ({
    day: WEEKDAY_LABELS[dayIndex],
    count: weekdayCounts.get(dayIndex) ?? 0,
  }))

  const mostActiveDay = creationByDay.reduce(
    (best, cur) => (cur.count > best.count ? cur : best),
    creationByDay[0]
  )

  const draftCount = totalCreated - publishedCount
  const publishRatePct = totalCreated > 0 ? Math.round((publishedCount / totalCreated) * 100) : 0
  const avgViewsPerInvitation = totalCreated > 0 ? Math.round(totalViews / totalCreated) : 0

  const modeBreakdown = [
    { mode: '템플릿 모드', value: templateModeCount, fill: 'var(--chart-1)' },
    { mode: '커스텀 에디터', value: customModeCount, fill: 'var(--chart-2)' },
  ]

  const statusBreakdown = [
    { status: '공개', value: publishedCount, fill: 'var(--chart-1)' },
    { status: '임시저장', value: draftCount, fill: 'var(--chart-3)' },
  ]

  const topInvitations = docs
    .map((d) => ({
      id: d.id,
      coupleNames: d.title ? String(d.title).replace(/\s*웨딩$/, '') : '이름 미입력',
      views: d.viewCount,
      status: (d.status ?? 'draft') as 'draft' | 'published',
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  return NextResponse.json({
    totalCreated,
    totalCreatedGrowthPct,
    mostActiveDay: mostActiveDay.day,
    mostActiveDayCount: mostActiveDay.count,
    publishRatePct,
    avgViewsPerInvitation,
    creationByDay,
    modeBreakdown,
    statusBreakdown,
    topInvitations,
  })
}
