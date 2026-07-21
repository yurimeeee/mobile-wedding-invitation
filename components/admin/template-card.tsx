"use client"

import { MoreHorizontal, Pencil, Copy, Eye, Trash2, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AdminTemplate } from "@/lib/admin-data"

interface TemplateCardProps {
  template: AdminTemplate
  onEdit: (template: AdminTemplate) => void
}

export function TemplateCard({ template, onEdit }: TemplateCardProps) {
  const isDark = template.bgColor === "#1a1a1a"

  return (
    <Card className="group overflow-hidden pt-0">
      <div className="relative aspect-[9/16] overflow-hidden bg-muted">
        {/* Simulated mobile preview */}
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: template.bgColor }}
        >
          <Heart
            className="size-6"
            style={{ color: isDark ? "#e8c4c4" : "#c98b8b" }}
            fill="currentColor"
          />
          <p
            className="font-serif text-lg leading-tight"
            style={{ color: isDark ? "#f5f5f5" : "#3a3a3a", fontFamily: template.fontFamily }}
          >
            민수 & 지영
          </p>
          <div className="h-px w-10" style={{ backgroundColor: isDark ? "#555" : "#d4c4c4" }} />
          <p
            className="text-xs"
            style={{ color: isDark ? "#bbb" : "#7a7a7a" }}
          >
            2026. 09. 20 토요일
          </p>
          <p className="text-xs" style={{ color: isDark ? "#999" : "#999" }}>
            더채플앳청담
          </p>
        </div>

        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur">
            {template.category}
          </Badge>
        </div>
        <div className="absolute right-3 top-3">
          <Badge
            className={
              template.status === "활성"
                ? "bg-emerald-500/90 text-white hover:bg-emerald-500/90"
                : "bg-muted-foreground/80 text-background hover:bg-muted-foreground/80"
            }
          >
            {template.status}
          </Badge>
        </div>
      </div>

      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium">{template.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {template.usageCount > 0
                ? `${template.usageCount.toLocaleString("ko-KR")}쌍이 사용 중`
                : "아직 사용된 적 없음"}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 shrink-0">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">메뉴 열기</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Pencil className="mr-2 size-4" />
                편집
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 size-4" />
                복제
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="mr-2 size-4" />
                미리보기
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
  )
}
