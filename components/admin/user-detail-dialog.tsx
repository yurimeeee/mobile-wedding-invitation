"use client"

import type { ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AccountStatusBadge } from "@/components/admin/status-badges"
import type { ManagedUser } from "@/lib/admin-data-extended"

interface UserDetailDialogProps {
  user: ManagedUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

export function UserDetailDialog({ user, open, onOpenChange }: UserDetailDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user.name}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <div className="divide-y rounded-md border px-3">
          <Row label="계정 상태" value={<AccountStatusBadge status={user.status} />} />
          <Row label="가입일" value={user.joinDate} />
          <Row label="최근 활동" value={user.lastActivityLabel} />
          <Row
            label="제작한 청첩장"
            value={
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary">{user.totalCreated}개 제작</Badge>
                {user.currentlyPublic > 0 && (
                  <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
                    {user.currentlyPublic}개 공개
                  </Badge>
                )}
              </div>
            }
          />
          <Row label="관리자 메모" value={user.adminNote || "없음"} />
        </div>

        {user.noteHistory.length > 0 && (
          <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3">
            {user.noteHistory
              .slice()
              .reverse()
              .map((h, idx) => (
                <div key={idx} className="text-sm">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{h.admin}</span>
                    <span>{h.date}</span>
                  </div>
                  <p className="mt-0.5 text-foreground">{h.note}</p>
                </div>
              ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
