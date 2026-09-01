'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteRSVP, loadRSVPs, type RSVPResponse } from '@/lib/rsvp-service'

interface RSVPModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invitationId: string
  title: string
}

function sideSummary(responses: RSVPResponse[], side: 'groom' | 'bride') {
  const sideResponses = responses.filter((r) => r.side === side)
  const attending = sideResponses.filter((r) => r.attending)
  return {
    attendingCount: attending.length,
    totalGuests: attending.reduce((sum, r) => sum + r.guestCount, 0),
    notAttendingCount: sideResponses.length - attending.length,
  }
}

function toCsv(responses: RSVPResponse[]): string {
  const header = ['성함', '구분', '참석여부', '참석인원', '식사여부', '동반인', '연락처', '응답일']
  const rows = responses.map((r) => [
    r.name,
    r.side === 'groom' ? '신랑측' : '신부측',
    r.attending ? '참석' : '불참',
    r.attending ? String(r.guestCount) : '0',
    r.attending ? (r.mealAttending ? '식사 참석' : '식사 안함') : '-',
    r.companions,
    r.phone,
    r.createdAt.toLocaleDateString('ko-KR'),
  ])
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

export function RSVPModal({ open, onOpenChange, invitationId, title }: RSVPModalProps) {
  const [responses, setResponses] = useState<RSVPResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    loadRSVPs(invitationId)
      .then(setResponses)
      .catch(() => toast.error('참석여부를 불러오지 못했습니다'))
      .finally(() => setIsLoading(false))
  }, [open, invitationId])

  const groom = useMemo(() => sideSummary(responses, 'groom'), [responses])
  const bride = useMemo(() => sideSummary(responses, 'bride'), [responses])

  const handleDelete = async (rsvp: RSVPResponse) => {
    setResponses((prev) => prev.filter((r) => r.id !== rsvp.id))
    try {
      await deleteRSVP(invitationId, rsvp)
      toast.success('삭제되었습니다')
    } catch {
      toast.error('삭제에 실패했습니다')
      loadRSVPs(invitationId).then(setResponses).catch(() => {})
    }
  }

  const handleDownload = () => {
    const csv = `﻿${toCsv(responses)}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title || '참석여부'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <div className="min-w-0">
              <DialogTitle>참석여부</DialogTitle>
              <p className="text-xs text-muted-foreground truncate">{title}</p>
            </div>
            {!isLoading && responses.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleDownload} className="shrink-0">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                엑셀 다운로드
              </Button>
            )}
          </div>
        </DialogHeader>

        {!isLoading && responses.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border p-2.5">
              <p className="text-xs text-muted-foreground mb-1">신랑측</p>
              <p className="font-medium">참석 {groom.attendingCount}건 · {groom.totalGuests}명</p>
              <p className="text-xs text-muted-foreground">불참 {groom.notAttendingCount}건</p>
            </div>
            <div className="rounded-lg border p-2.5">
              <p className="text-xs text-muted-foreground mb-1">신부측</p>
              <p className="font-medium">참석 {bride.attendingCount}건 · {bride.totalGuests}명</p>
              <p className="text-xs text-muted-foreground">불참 {bride.notAttendingCount}건</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && responses.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">아직 전달된 참석여부가 없어요</p>
        )}

        {!isLoading && responses.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
            {responses.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-medium">{r.name}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {r.side === 'groom' ? '신랑측' : '신부측'}
                    </Badge>
                    {r.attending ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400 text-[10px] px-1.5 py-0">
                        참석 · {r.guestCount}명
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">불참</Badge>
                    )}
                    {r.attending && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {r.mealAttending ? '식사 참석' : '식사 안함'}
                      </Badge>
                    )}
                  </div>
                  {r.companions && <p className="text-xs text-muted-foreground mt-1">동반인: {r.companions}</p>}
                  {r.phone && <p className="text-xs text-muted-foreground mt-0.5">{r.phone}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1.5">{r.createdAt.toLocaleDateString('ko-KR')}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive"
                  onClick={() => handleDelete(r)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
