"use client"

import { useEffect, useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { StatCards } from "@/components/admin/stat-cards"
import { InvitationsChart } from "@/components/admin/invitations-chart"
import { TemplatePopularity } from "@/components/admin/template-popularity"
import { RecentInvitations } from "@/components/admin/recent-invitations"
import { fetchAdminStats, type AdminStatsResponse } from "@/lib/admin-data-client"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <>
      <AdminHeader breadcrumb="대시보드" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            모바일 청첩장 서비스 현황을 한눈에 확인하세요.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!stats ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <>
            <StatCards stats={stats} />

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <InvitationsChart data={stats.monthly} />
              </div>
              <div className="lg:col-span-1">
                <TemplatePopularity data={stats.templatePopularity} />
              </div>
            </div>

            <RecentInvitations invitations={stats.recentInvitations} />
          </>
        )}
      </main>
    </>
  )
}
