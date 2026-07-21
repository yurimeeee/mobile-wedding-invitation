'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { db } from '@/lib/firebase'
import { useAdminAuthContext } from '@/hooks/use-admin-auth'
import { AdminHeader } from '@/components/admin/admin-header'
import { AddAdminDialog } from '@/components/admin/add-admin-dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AdminRow {
  uid: string
  name: string
  email: string
  createdAt: Timestamp | null
  createdBy: string | null
}

export default function AdminsPage() {
  const { adminProfile } = useAdminAuthContext()
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'adminUsers'), orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAdmins(
          snap.docs.map((d) => {
            const data = d.data()
            return {
              uid: d.id,
              name: data.name,
              email: data.email,
              createdAt: data.createdAt ?? null,
              createdBy: data.createdBy ?? null,
            }
          })
        )
      },
      () => toast.error('관리자 목록을 불러오지 못했습니다.')
    )
    return () => unsubscribe()
  }, [])

  const resolveCreatorName = (createdBy: string | null) => {
    if (createdBy === null) return '최초 관리자 (부트스트랩)'
    return admins.find((a) => a.uid === createdBy)?.name ?? '알 수 없음'
  }

  return (
    <>
      <AdminHeader breadcrumb="관리자 관리" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">관리자 관리</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              어드민 패널에 접근 가능한 관리자 계정을 관리합니다.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="mr-2 size-4" />
            관리자 추가
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>관리자</TableHead>
                <TableHead className="hidden md:table-cell">등록일</TableHead>
                <TableHead>등록자</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.uid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-accent/20 text-sm text-accent-foreground">
                          {admin.name?.charAt(0) ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium leading-tight">
                          {admin.name}
                          {admin.uid === adminProfile?.uid && (
                            <Badge variant="secondary" className="ml-2 align-middle">
                              나
                            </Badge>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {admin.createdAt ? admin.createdAt.toDate().toLocaleDateString('ko-KR') : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {resolveCreatorName(admin.createdBy)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>

      <AddAdminDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => toast.success('관리자가 추가되었습니다.')}
      />
    </>
  )
}
