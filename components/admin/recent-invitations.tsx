import { MoreHorizontal, Eye, PowerOff, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AdminStatsResponse } from "@/lib/admin-data-client"

interface RecentInvitationsProps {
  invitations: AdminStatsResponse["recentInvitations"]
}

export function RecentInvitations({ invitations }: RecentInvitationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 제작된 청첩장</CardTitle>
        <CardDescription>최근 등록된 모바일 청첩장 목록</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>청첩장 ID</TableHead>
                <TableHead>신랑 & 신부</TableHead>
                <TableHead className="hidden md:table-cell">사용 템플릿</TableHead>
                <TableHead className="hidden sm:table-cell">제작일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    아직 제작된 청첩장이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{inv.id || "-"}</TableCell>
                  <TableCell className="font-medium">{inv.coupleNames}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{inv.templateName}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {inv.createdAt ? inv.createdAt.slice(0, 10) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={inv.status === "published" ? "default" : "secondary"}
                      className={
                        inv.status === "published"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15"
                          : ""
                      }
                    >
                      {inv.status === "published" ? "공개" : "임시저장"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">메뉴 열기</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 size-4" />
                          보기
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <PowerOff className="mr-2 size-4" />
                          비활성화
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
      </CardContent>
    </Card>
  )
}
