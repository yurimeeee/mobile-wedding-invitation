import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { UsageType, InvitationStatus, AccountStatus } from "@/lib/admin-data-extended"

export function UsageBadge({ type }: { type: UsageType }) {
  const styles: Record<UsageType, string> = {
    무료: "bg-muted text-muted-foreground hover:bg-muted",
    베이직: "bg-sky-500/15 text-sky-700 dark:text-sky-400 hover:bg-sky-500/15",
    프리미엄: "bg-accent/20 text-accent-foreground hover:bg-accent/20 border border-accent/30",
  }
  return <Badge className={cn("font-medium", styles[type])}>{type}</Badge>
}

export function StatusBadge({ status }: { status: InvitationStatus }) {
  const config: Record<InvitationStatus, { dot: string; className: string }> = {
    공개: {
      dot: "bg-emerald-500",
      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15",
    },
    비공개: {
      dot: "bg-amber-500",
      className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15",
    },
    만료: {
      dot: "bg-rose-500",
      className: "bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-500/15",
    },
  }
  const { dot, className } = config[status]
  return (
    <Badge className={cn("gap-1.5 font-medium", className)}>
      <span className={cn("size-1.5 rounded-full", dot)} />
      {status}
    </Badge>
  )
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const config: Record<AccountStatus, { dot: string; className: string }> = {
    활성: {
      dot: "bg-emerald-500",
      className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15",
    },
    차단: {
      dot: "bg-rose-500",
      className: "bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-500/15",
    },
  }
  const { dot, className } = config[status]
  return (
    <Badge className={cn("gap-1.5 font-medium", className)}>
      <span className={cn("size-1.5 rounded-full", dot)} />
      {status}
    </Badge>
  )
}

export function MiniThumbnail({ bgColor, className }: { bgColor: string; className?: string }) {
  const isDark = bgColor === "#1a1a1a"
  return (
    <div
      className={cn("flex aspect-[9/16] w-8 shrink-0 flex-col items-center justify-center gap-0.5 rounded-sm border", className)}
      style={{ backgroundColor: bgColor }}
    >
      <div className="h-0.5 w-3 rounded-full" style={{ backgroundColor: isDark ? "#e8c4c4" : "#c98b8b" }} />
      <div className="h-0.5 w-2 rounded-full" style={{ backgroundColor: isDark ? "#666" : "#d4c4c4" }} />
    </div>
  )
}
