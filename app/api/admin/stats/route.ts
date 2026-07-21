import { NextResponse, type NextRequest } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAdminRequest } from '@/lib/admin-api-auth'
import { templates } from '@/lib/types'

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate()
  return null
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminRequest(request)
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 })

  const snapshot = await adminDb.collection('invitations').get()
  const docs = snapshot.docs.map((d) => {
    const data = d.data() as Record<string, unknown>
    return { id: d.id, title: data.title, template: data.template, status: data.status, createdAt: data.createdAt }
  })

  const totalInvitations = docs.length

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  let thisMonthCount = 0
  let lastMonthCount = 0

  const monthBuckets = new Map<string, number>()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthBuckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0)
  }

  const templateUsage = new Map<string, number>()

  for (const d of docs) {
    const createdAt = toDate(d.createdAt)
    if (createdAt) {
      if (createdAt >= thisMonthStart) thisMonthCount++
      else if (createdAt >= lastMonthStart) lastMonthCount++

      const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`
      if (monthBuckets.has(key)) monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + 1)
    }

    if (typeof d.template === 'string') {
      templateUsage.set(d.template, (templateUsage.get(d.template) ?? 0) + 1)
    }
  }

  const invitationsGrowthPct = lastMonthCount === 0 ? null : Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)

  const monthly = Array.from(monthBuckets.entries()).map(([key, count]) => {
    const [, monthIndexStr] = key.split('-')
    return { month: MONTH_LABELS[Number(monthIndexStr)], count }
  })

  const maxUsage = Math.max(1, ...Array.from(templateUsage.values()))
  const templatePopularity = templates
    .map((tpl) => {
      const usage = templateUsage.get(tpl.id) ?? 0
      return { id: tpl.id, name: tpl.nameKr, usage, percentage: Math.round((usage / maxUsage) * 100) }
    })
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 5)

  const recentInvitations = docs
    .map((d) => {
      const createdAt = toDate(d.createdAt)
      const templateMeta = templates.find((t) => t.id === d.template)
      return {
        id: d.id,
        coupleNames: d.title ? String(d.title).replace(/\s*웨딩$/, '') : '이름 미입력',
        templateId: d.template ?? null,
        templateName: templateMeta?.nameKr ?? d.template ?? '알 수 없음',
        status: (d.status ?? 'draft') as 'draft' | 'published',
        createdAt: createdAt ? createdAt.toISOString() : null,
      }
    })
    .filter((inv) => inv.createdAt)
    .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime())
    .slice(0, 6)

  return NextResponse.json({
    totalInvitations,
    invitationsGrowthPct,
    totalTemplates: templates.length,
    totalViews: 0,
    conversionRatePct: 0,
    monthly,
    templatePopularity,
    recentInvitations,
  })
}
