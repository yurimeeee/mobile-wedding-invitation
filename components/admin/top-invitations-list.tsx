"use client"

import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AdminAnalyticsResponse } from "@/lib/admin-data-client"

interface TopInvitationsListProps {
  data: AdminAnalyticsResponse["topInvitations"]
}

export function TopInvitationsList({ data }: TopInvitationsListProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>조회수 TOP 5</CardTitle>
        <CardDescription>가장 많이 열람된 청첩장</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {data.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">아직 조회 기록이 없습니다.</p>
        ) : (
          data.map((inv, index) => (
            <button
              key={inv.id}
              onClick={() => router.push(`/admin/preview/${inv.id}`)}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-accent/10"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent-foreground">
                  {index + 1}
                </span>
                <span className="truncate text-sm font-medium">{inv.coupleNames}</span>
                <Badge
                  variant="secondary"
                  className={
                    inv.status === "published"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15"
                      : ""
                  }
                >
                  {inv.status === "published" ? "공개" : "임시저장"}
                </Badge>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                <Eye className="size-3.5" />
                {inv.views.toLocaleString("ko-KR")}
              </span>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  )
}
