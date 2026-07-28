"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Search,
  LayoutGrid,
  List,
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  Calendar as CalendarIcon,
  Trash2,
  X,
} from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { InvitationsTable } from "@/components/admin/invitations-table"
import { InvitationsGrid } from "@/components/admin/invitations-grid"
import {
  usageTypeOptions,
  statusOptions,
  type ManagedInvitation,
} from "@/lib/admin-data-extended"
import {
  fetchAdminInvitations,
  setInvitationStatus,
  deleteAdminInvitation,
  bulkDeleteAdminInvitations,
  type AdminInvitation,
} from "@/lib/admin-data-client"
import { templates } from "@/lib/types"
import type { DateRange } from "react-day-picker"
import { toast } from "sonner"

function toManagedInvitation(inv: AdminInvitation): ManagedInvitation {
  const templateMeta = templates.find((t) => t.id === inv.templateId)
  return {
    id: inv.id,
    slug: inv.slug,
    coupleNames: inv.coupleNames,
    groomName: inv.groomName,
    brideName: inv.brideName,
    creatorName: inv.creatorName || "탈퇴한 사용자",
    creatorEmail: inv.creatorEmail || "-",
    // 유료 등급 체계가 아직 없어 전부 무료로 표시합니다.
    usageType: "무료",
    status: inv.status === "published" ? "공개" : "비공개",
    createdDate: inv.createdAt ? inv.createdAt.slice(0, 10) : "-",
    // 만료일 개념이 아직 없습니다.
    expiryDate: "-",
    views: inv.views,
    rsvps: inv.rsvps,
    bgColor: templateMeta?.colors[0] ?? "#f5f5f5",
    template: inv.templateName,
  }
}

type SortKey = "createdDate" | "expiryDate" | "views" | "usageType"

const sortLabels: Record<SortKey, string> = {
  createdDate: "제작일",
  expiryDate: "만료일",
  views: "총 조회수",
  usageType: "사용 등급",
}

const usageOrder: Record<string, number> = { 무료: 0, 베이직: 1, 프리미엄: 2 }

export default function InvitationsPage() {
  const [managedInvitations, setManagedInvitations] = useState<ManagedInvitation[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [usageFilter, setUsageFilter] = useState<string>("전체")
  const [statusFilter, setStatusFilter] = useState<string>("전체")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [view, setView] = useState<"table" | "grid">("table")
  const [sortKey, setSortKey] = useState<SortKey>("createdDate")
  const [sortAsc, setSortAsc] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    fetchAdminInvitations()
      .then(({ invitations }) => setManagedInvitations(invitations.map(toManagedInvitation)))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = managedInvitations.filter((inv) => {
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        inv.coupleNames.toLowerCase().includes(q) ||
        inv.id.toLowerCase().includes(q) ||
        inv.creatorEmail.toLowerCase().includes(q)
      const matchesUsage = usageFilter === "전체" || inv.usageType === usageFilter
      const matchesStatus = statusFilter === "전체" || inv.status === statusFilter
      let matchesDate = true
      if (dateRange?.from) {
        const created = new Date(inv.createdDate)
        matchesDate = created >= dateRange.from
        if (dateRange.to) matchesDate = matchesDate && created <= dateRange.to
      }
      return matchesSearch && matchesUsage && matchesStatus && matchesDate
    })

    list = list.slice().sort((a, b) => {
      let cmp = 0
      if (sortKey === "views") cmp = a.views - b.views
      else if (sortKey === "usageType") cmp = usageOrder[a.usageType] - usageOrder[b.usageType]
      else cmp = new Date(a[sortKey]).getTime() - new Date(b[sortKey]).getTime()
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [managedInvitations, search, usageFilter, statusFilter, dateRange, sortKey, sortAsc])

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleAll = () =>
    setSelected((prev) => (prev.length === filtered.length ? [] : filtered.map((i) => i.id)))

  const handlePreview = (inv: ManagedInvitation) => {
    window.open(`/admin/preview/${inv.id}`, "_blank")
  }

  const handleCopyLink = async (inv: ManagedInvitation) => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const url = `${origin}/invitation/${inv.slug || inv.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("공유 링크를 복사했습니다.")
    } catch {
      toast.error("링크 복사에 실패했습니다.")
    }
  }

  const handleToggleVisibility = async (inv: ManagedInvitation) => {
    const nextStatus = inv.status === "공개" ? "draft" : "published"
    try {
      await setInvitationStatus(inv.id, nextStatus)
      setManagedInvitations((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, status: nextStatus === "published" ? "공개" : "비공개" } : i))
      )
      toast.success(nextStatus === "published" ? "공개로 전환했습니다." : "비공개로 전환했습니다.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "상태 변경 중 오류가 발생했습니다.")
    }
  }

  const handleDelete = async (inv: ManagedInvitation) => {
    if (!window.confirm(`'${inv.coupleNames}' 청첩장을 삭제할까요? 되돌릴 수 없습니다.`)) return
    try {
      await deleteAdminInvitation(inv.id)
      setManagedInvitations((prev) => prev.filter((i) => i.id !== inv.id))
      setSelected((prev) => prev.filter((id) => id !== inv.id))
      toast.success("청첩장을 삭제했습니다.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.")
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`선택한 ${selected.length}건을 삭제할까요? 되돌릴 수 없습니다.`)) return
    try {
      await bulkDeleteAdminInvitations(selected)
      setManagedInvitations((prev) => prev.filter((i) => !selected.includes(i.id)))
      setSelected([])
      toast.success("선택한 청첩장을 삭제했습니다.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "일괄 삭제 중 오류가 발생했습니다.")
    }
  }

  const dateLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from)} ~ ${format(dateRange.to)}`
      : format(dateRange.from)
    : "제작일 기간"

  return (
    <>
      <AdminHeader breadcrumb="제작된 청첩장" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">제작된 청첩장</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          사용자가 제작한 모든 모바일 청첩장을 조회하고 관리합니다.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}

      {/* Control bar */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        {/* Row 1: search + filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="신랑/신부 이름, 청첩장 ID, 이메일로 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={usageFilter} onValueChange={setUsageFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="사용 등급" />
              </SelectTrigger>
              <SelectContent>
                {usageTypeOptions.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o === "전체" ? "전체 등급" : o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o === "전체" ? "전체 상태" : o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start gap-2 font-normal">
                  <CalendarIcon className="size-4" />
                  {dateLabel}
                  {dateRange?.from && (
                    <X
                      className="size-3.5 text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDateRange(undefined)
                      }}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Row 2: views + sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              총 {filtered.length.toLocaleString("ko-KR")}건
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <ArrowDownUp className="size-4 text-muted-foreground" />
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {sortLabels[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortAsc((s) => !s)}
                aria-label={sortAsc ? "오름차순" : "내림차순"}
              >
                {sortAsc ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
              </Button>
            </div>
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(v) => v && setView(v as "table" | "grid")}
              variant="outline"
            >
              <ToggleGroupItem value="table" aria-label="테이블 보기">
                <List className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="썸네일 보기">
                <LayoutGrid className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Batch actions */}
        {selected.length > 0 && (
          <div className="flex items-center justify-between rounded-md bg-accent/10 px-3 py-2">
            <span className="text-sm font-medium">{selected.length}건 선택됨</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                선택 해제
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-1.5 size-4" />
                일괄 삭제
              </Button>
            </div>
          </div>
        )}
      </div>

      {view === "table" ? (
        <InvitationsTable
          invitations={filtered}
          selected={selected}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onPreview={handlePreview}
          onCopyLink={handleCopyLink}
          onToggleVisibility={handleToggleVisibility}
          onDelete={handleDelete}
        />
      ) : (
        <InvitationsGrid
          invitations={filtered}
          onPreview={handlePreview}
          onCopyLink={handleCopyLink}
          onToggleVisibility={handleToggleVisibility}
          onDelete={handleDelete}
        />
      )}
      </main>
    </>
  )
}

function format(d: Date) {
  return `${d.getMonth() + 1}/${d.getDate()}`
}
