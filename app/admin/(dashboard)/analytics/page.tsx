"use client"

import { useEffect, useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AnalyticsKpis } from "@/components/admin/analytics-kpis"
import { WeekdayChart } from "@/components/admin/weekday-chart"
import { BreakdownDonutChart } from "@/components/admin/breakdown-donut-chart"
import { TopInvitationsList } from "@/components/admin/top-invitations-list"
import { fetchAdminAnalytics, type AdminAnalyticsResponse } from "@/lib/admin-data-client"

export default function AnalyticsPage() {
  const [data, setData] = useState<AdminAnalyticsResponse | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAdminAnalytics()
      .then(setData)
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <>
      <AdminHeader breadcrumb="통계 분석" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">통계 분석</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            청첩장 제작·발행 패턴을 더 깊이 있게 분석합니다.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!data ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <>
            <AnalyticsKpis data={data} />

            <div className="grid gap-6 lg:grid-cols-2">
              <WeekdayChart data={data.creationByDay} />
              <TopInvitationsList data={data.topInvitations} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <BreakdownDonutChart
                title="에디터 모드 분포"
                description="템플릿 모드 vs 커스텀 에디터 사용 비율"
                data={data.modeBreakdown.map((m) => ({ label: m.mode, value: m.value, fill: m.fill }))}
              />
              <BreakdownDonutChart
                title="공개 상태 분포"
                description="공개 vs 임시저장 비율"
                data={data.statusBreakdown.map((s) => ({ label: s.status, value: s.value, fill: s.fill }))}
              />
            </div>
          </>
        )}
      </main>
    </>
  )
}
