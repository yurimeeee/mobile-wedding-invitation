"use client"

import { MoreHorizontal, Pencil, Link2, Eye, EyeOff, Trash2, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UsageBadge, StatusBadge } from "./status-badges"
import type { ManagedInvitation } from "@/lib/admin-data-extended"

function PreviewCard({ inv }: { inv: ManagedInvitation }) {
  const isDark = inv.bgColor === "#1a1a1a"
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
      style={{ backgroundColor: inv.bgColor }}
    >
      <Heart className="size-5" style={{ color: isDark ? "#e8c4c4" : "#c98b8b" }} fill="currentColor" />
      <p
        className="font-serif text-base leading-tight"
        style={{ color: isDark ? "#f5f5f5" : "#3a3a3a" }}
      >
        {inv.groomName}
        <br />& {inv.brideName}
      </p>
      <div className="h-px w-8" style={{ backgroundColor: isDark ? "#555" : "#d4c4c4" }} />
      <p className="text-[10px]" style={{ color: isDark ? "#bbb" : "#7a7a7a" }}>
        {inv.createdDate.replace(/-/g, ". ")}
      </p>
    </div>
  )
}

export function InvitationsGrid({ invitations }: { invitations: ManagedInvitation[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {invitations.map((inv) => (
        <Card key={inv.id} className="group overflow-hidden pt-0">
          <div className="relative aspect-[9/16] overflow-hidden bg-muted">
            <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
              <PreviewCard inv={inv} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-foreground/60 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
              <Button size="sm" variant="secondary" className="w-28">
                <Eye className="mr-1.5 size-4" />
                빠른 보기
              </Button>
              <Button size="sm" variant="secondary" className="w-28">
                <Pencil className="mr-1.5 size-4" />
                관리자 편집
              </Button>
            </div>
            <div className="absolute left-2 top-2">
              <StatusBadge status={inv.status} />
            </div>
          </div>
          <CardContent className="px-3">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="truncate font-medium leading-tight">{inv.coupleNames}</p>
                <p className="truncate text-xs text-muted-foreground">{inv.creatorName}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <UsageBadge type={inv.usageType} />
                  <span className="text-[10px] text-muted-foreground">{inv.createdDate}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">메뉴 열기</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Pencil className="mr-2 size-4" />
                    관리자 강제 편집
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link2 className="mr-2 size-4" />
                    공유 링크 복사
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {inv.status === "공개" ? (
                      <>
                        <EyeOff className="mr-2 size-4" />
                        비공개로 전환
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 size-4" />
                        공개로 전환
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 size-4" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
