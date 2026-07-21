"use client"

import { useState, useEffect } from "react"
import { History } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { ManagedUser } from "@/lib/admin-data-extended"

interface AdminNoteModalProps {
  user: ManagedUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (userId: string, note: string) => void
}

export function AdminNoteModal({ user, open, onOpenChange, onSave }: AdminNoteModalProps) {
  const [note, setNote] = useState("")

  useEffect(() => {
    setNote(user?.adminNote ?? "")
  }, [user])

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user.name}님의 관리자 메모</DialogTitle>
          <DialogDescription>
            내부 관리용 메모입니다. 사용자에게는 표시되지 않습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="admin-note">메모 내용</Label>
          <Textarea
            id="admin-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예) VIP 고객 / 환불 이력 있음 / 특이사항 기록"
            rows={4}
          />
        </div>

        {user.noteHistory.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <History className="size-4 text-muted-foreground" />
              변경 이력
            </div>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3">
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
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={() => {
              onSave(user.id, note)
              onOpenChange(false)
            }}
          >
            메모 저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
