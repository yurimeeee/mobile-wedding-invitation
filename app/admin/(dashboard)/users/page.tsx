"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Search,
  Download,
  MoreHorizontal,
  UserCog,
  StickyNote,
  KeyRound,
  Ban,
  Trash2,
  MessageSquareText,
} from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AccountStatusBadge } from "@/components/admin/status-badges"
import { AdminNoteModal } from "@/components/admin/admin-note-modal"
import { UserDetailDialog } from "@/components/admin/user-detail-dialog"
import { accountStatusOptions, type ManagedUser } from "@/lib/admin-data-extended"
import {
  fetchAdminUsers,
  setUserDisabled,
  saveUserNote,
  getPasswordResetLink,
  deleteAdminUser,
  type AdminUser,
} from "@/lib/admin-data-client"
import { toast } from "sonner"

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return "방금 전"
  if (diffHours < 24) return `${diffHours}시간 전`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return "어제"
  if (diffDays < 7) return `${diffDays}일 전`
  return iso.slice(0, 10)
}

function toManagedUser(u: AdminUser): ManagedUser {
  const lastActivityIso = u.lastSignInAt ?? u.lastInvitationAt
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    joinDate: u.joinDate ? u.joinDate.slice(0, 10) : "-",
    totalCreated: u.totalCreated,
    currentlyPublic: u.currentlyPublic,
    lastActivity: lastActivityIso ? lastActivityIso.slice(0, 10) : "-",
    lastActivityLabel: lastActivityIso ? formatRelative(lastActivityIso) : "활동 없음",
    status: u.disabled ? "차단" : "활성",
    adminNote: u.note,
    noteHistory: u.noteHistory,
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loadError, setLoadError] = useState("")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("전체")
  const [noteUser, setNoteUser] = useState<ManagedUser | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<ManagedUser | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")
    if (q) setSearch(q)
  }, [])

  useEffect(() => {
    fetchAdminUsers()
      .then(({ users: fetched }) => setUsers(fetched.map(toManagedUser)))
      .catch((err: Error) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const toggleBlock = async (user: ManagedUser) => {
    const nextDisabled = user.status !== "차단"
    try {
      await setUserDisabled(user.id, nextDisabled)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextDisabled ? "차단" : "활성" } : u))
      )
      toast.success(nextDisabled ? "사용자를 차단했습니다." : "차단을 해제했습니다.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.")
    }
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "전체" || u.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [users, search, statusFilter])

  const openNote = (user: ManagedUser) => {
    setNoteUser(user)
    setModalOpen(true)
  }

  const openDetail = (user: ManagedUser) => {
    setDetailUser(user)
    setDetailOpen(true)
  }

  const exportCsv = () => {
    const header = ["이름", "이메일", "가입일", "제작한 청첩장", "공개 중", "최근 활동", "상태", "메모"]
    const rows = filtered.map((u) => [
      u.name,
      u.email,
      u.joinDate,
      String(u.totalCreated),
      String(u.currentlyPublic),
      u.lastActivityLabel,
      u.status,
      u.adminNote,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `사용자목록_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyResetLink = async (user: ManagedUser) => {
    try {
      const { link } = await getPasswordResetLink(user.id)
      await navigator.clipboard.writeText(link)
      toast.success("비밀번호 재설정 링크를 복사했습니다.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "링크 생성 중 오류가 발생했습니다.")
    }
  }

  const removeUser = async (user: ManagedUser) => {
    if (!window.confirm(`'${user.name}' 계정을 삭제할까요? 되돌릴 수 없습니다.`)) return
    try {
      await deleteAdminUser(user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      toast.success("사용자 계정을 삭제했습니다.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.")
    }
  }

  const saveNote = async (userId: string, note: string) => {
    try {
      const result = await saveUserNote(userId, note)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, adminNote: result.note, noteHistory: result.noteHistory } : u,
        ),
      )
      toast.success("메모를 저장했습니다.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "메모 저장 중 오류가 발생했습니다.")
    }
  }

  return (
    <>
      <AdminHeader breadcrumb="사용자 관리" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">사용자 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            가입 사용자와 청첩장 이용 현황을 관리합니다.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="mr-2 size-4" />
          사용자 CSV 내보내기
        </Button>
      </div>

      {loadError && <p className="text-sm text-destructive">{loadError}</p>}
      {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}

      {/* Search & filter */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="이름 또는 이메일로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="계정 상태" />
          </SelectTrigger>
          <SelectContent>
            {accountStatusOptions.map((o) => (
              <SelectItem key={o} value={o}>
                {o === "전체" ? "전체 상태" : o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>사용자</TableHead>
              <TableHead className="hidden md:table-cell">가입일</TableHead>
              <TableHead>청첩장 이용</TableHead>
              <TableHead className="hidden lg:table-cell">최근 활동</TableHead>
              <TableHead className="hidden xl:table-cell">관리자 메모</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-accent/20 text-sm text-accent-foreground">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {user.joinDate}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{user.totalCreated}개 제작</Badge>
                    {user.currentlyPublic > 0 && (
                      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
                        {user.currentlyPublic}개 공개
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {user.lastActivityLabel}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {user.adminNote ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => openNote(user)}
                          className="flex max-w-40 items-center gap-1.5 text-left text-sm text-muted-foreground hover:text-foreground"
                        >
                          <MessageSquareText className="size-4 shrink-0 text-accent" />
                          <span className="truncate">{user.adminNote}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{user.adminNote}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <button
                      onClick={() => openNote(user)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground"
                    >
                      <StickyNote className="size-4" />
                      메모 추가
                    </button>
                  )}
                </TableCell>
                <TableCell>
                  <AccountStatusBadge status={user.status} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">메뉴 열기</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => openDetail(user)}>
                        <UserCog className="mr-2 size-4" />
                        사용자 상세 보기
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openNote(user)}>
                        <StickyNote className="mr-2 size-4" />
                        메모 편집
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyResetLink(user)}>
                        <KeyRound className="mr-2 size-4" />
                        비밀번호 재설정 링크
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleBlock(user)}>
                        <Ban className="mr-2 size-4" />
                        {user.status === "차단" ? "차단 해제" : "사용자 차단"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => removeUser(user)}
                      >
                        <Trash2 className="mr-2 size-4" />
                        사용자 삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AdminNoteModal
        user={noteUser}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={saveNote}
      />
      <UserDetailDialog user={detailUser} open={detailOpen} onOpenChange={setDetailOpen} />
      </main>
    </>
  )
}
