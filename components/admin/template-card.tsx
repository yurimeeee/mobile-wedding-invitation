"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { TemplateThumbnail } from "@/components/editor/template-thumbnail"
import type { AdminTemplateItem } from "@/lib/admin-data-client"
import type { TemplateType } from "@/lib/types"

interface TemplateCardProps {
  template: AdminTemplateItem
  onToggleDisabled: (template: AdminTemplateItem, disabled: boolean) => void
}

export function TemplateCard({ template, onToggleDisabled }: TemplateCardProps) {
  return (
    <Card className="group overflow-hidden pt-0">
      <div className="relative aspect-[9/16] overflow-hidden bg-muted">
        <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
          <TemplateThumbnail id={template.id as TemplateType} />
        </div>
        <div className="absolute right-3 top-3">
          <Badge
            className={
              template.disabled
                ? "bg-muted-foreground/80 text-background hover:bg-muted-foreground/80"
                : "bg-emerald-500/90 text-white hover:bg-emerald-500/90"
            }
          >
            {template.disabled ? "비활성화" : "활성"}
          </Badge>
        </div>
      </div>

      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium">{template.nameKr}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {template.usageCount > 0
                ? `${template.usageCount.toLocaleString("ko-KR")}쌍이 사용 중`
                : "아직 사용된 적 없음"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Label htmlFor={`tpl-${template.id}`} className="text-xs text-muted-foreground">
              선택 가능
            </Label>
            <Switch
              id={`tpl-${template.id}`}
              checked={!template.disabled}
              onCheckedChange={(checked) => onToggleDisabled(template, !checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
