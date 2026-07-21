"use client"

import { MoreHorizontal, Pencil, Link2, Eye, EyeOff, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UsageBadge, StatusBadge, MiniThumbnail } from "./status-badges"
import type { ManagedInvitation } from "@/lib/admin-data-extended"

interface InvitationsTableProps {
  invitations: ManagedInvitation[]
  selected: string[]
  onToggle: (id: string) => void
  onToggleAll: () => void
}

export function InvitationsTable({ invitations, selected, onToggle, onToggleAll }: InvitationsTableProps) {
  const allSelected = invitations.length > 0 && selected.length === invitations.length

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleAll}
                aria-label="전체 선택"
              />
            </TableHead>
            <TableHead>청첩장</TableHead>
            <TableHead className="hidden lg:table-cell">제작자</TableHead>
            <TableHead>등급</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="hidden md:table-cell">제작일 / 만료일</TableHead>
            <TableHead className="hidden sm:table-cell text-right">조회 / RSVP</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((inv) => (
            <TableRow key={inv.id} data-state={selected.includes(inv.id) ? "selected" : undefined}>
              <TableCell>
                <Checkbox
                  checked={selected.includes(inv.id)}
                  onCheckedChange={() => onToggle(inv.id)}
                  aria-label={`${inv.coupleNames} 선택`}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <MiniThumbnail bgColor={inv.bgColor} />
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">{inv.coupleNames}</p>
                    <p className="font-mono text-xs text-muted-foreground">{inv.id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <p className="text-sm leading-tight">{inv.creatorName}</p>
                <p className="text-xs text-muted-foreground">{inv.creatorEmail}</p>
              </TableCell>
              <TableCell>
                <UsageBadge type={inv.usageType} />
              </TableCell>
              <TableCell>
                <StatusBadge status={inv.status} />
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                <p>{inv.createdDate}</p>
                <p className="text-xs">~ {inv.expiryDate}</p>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-right text-sm">
                <p>{inv.views.toLocaleString("ko-KR")}</p>
                <p className="text-xs text-muted-foreground">RSVP {inv.rsvps}</p>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
