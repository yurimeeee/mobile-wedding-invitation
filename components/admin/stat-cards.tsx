import { Mail, LayoutTemplate, Eye, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { AdminStatsResponse } from "@/lib/admin-data-client"

interface StatCardsProps {
  stats: AdminStatsResponse
}

export function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      label: "총 제작된 청첩장",
      value: stats.totalInvitations.toLocaleString("ko-KR"),
      growth: stats.invitationsGrowthPct,
      growthLabel: stats.invitationsGrowthPct === null ? "전월 데이터 없음" : "전월 대비",
      icon: Mail,
    },
    {
      label: "제공 템플릿",
      value: stats.totalTemplates.toString(),
      growth: null,
      growthLabel: "고정 디자인 수",
      icon: LayoutTemplate,
    },
    {
      label: "총 조회수 / RSVP",
      value: stats.totalViews.toLocaleString("ko-KR"),
      growth: null,
      growthLabel: "추적 예정",
      icon: Eye,
    },
    {
      label: "전환율",
      value: `${stats.conversionRatePct}%`,
      growth: null,
      growthLabel: "추적 예정",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
                <stat.icon className="size-5" />
              </div>
              {stat.growth !== null && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    stat.growth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {stat.growth >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                  {Math.abs(stat.growth)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.growthLabel}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
