import { FilePlus2, CalendarDays, Radio, Eye, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { AdminAnalyticsResponse } from "@/lib/admin-data-client"

interface AnalyticsKpisProps {
  data: AdminAnalyticsResponse
}

export function AnalyticsKpis({ data }: AnalyticsKpisProps) {
  const cards = [
    {
      label: "총 제작된 청첩장",
      value: data.totalCreated.toLocaleString("ko-KR"),
      growth: data.totalCreatedGrowthPct,
      growthLabel: data.totalCreatedGrowthPct === null ? "전월 데이터 없음" : "전월 대비",
      icon: FilePlus2,
    },
    {
      label: "가장 활발한 요일",
      value: `${data.mostActiveDay}요일`,
      growth: null,
      growthLabel: `${data.mostActiveDayCount.toLocaleString("ko-KR")}건 제작`,
      icon: CalendarDays,
    },
    {
      label: "발행률",
      value: `${data.publishRatePct}%`,
      growth: null,
      growthLabel: "전체 중 공개 상태 비율",
      icon: Radio,
    },
    {
      label: "청첩장당 평균 조회수",
      value: data.avgViewsPerInvitation.toLocaleString("ko-KR"),
      growth: null,
      growthLabel: "1건당 평균 조회 수",
      icon: Eye,
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
