"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Mail, User } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { fetchAdminInvitations, fetchAdminUsers, type AdminInvitation, type AdminUser } from "@/lib/admin-data-client"

export function AdminSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [invitations, setInvitations] = useState<AdminInvitation[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])

  const load = useCallback(() => {
    if (loaded) return
    Promise.all([fetchAdminInvitations(), fetchAdminUsers()])
      .then(([inv, u]) => {
        setInvitations(inv.invitations)
        setUsers(u.users)
        setLoaded(true)
      })
      .catch(() => {})
  }, [loaded])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) load()
  }

  const goToInvitation = (id: string) => {
    setOpen(false)
    router.push(`/admin/preview/${id}`)
  }

  const goToUser = (email: string) => {
    setOpen(false)
    router.push(`/admin/users?q=${encodeURIComponent(email)}`)
  }

  return (
    <>
      <button
        onClick={() => handleOpenChange(true)}
        className="relative hidden w-56 items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/10 sm:flex"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">검색...</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:flex">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={handleOpenChange} title="검색" description="청첩장 또는 사용자를 검색하세요">
        <CommandInput placeholder="청첩장(신랑/신부, 이메일) 또는 사용자 검색..." />
        <CommandList>
          <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
          <CommandGroup heading="청첩장">
            {invitations.map((inv) => (
              <CommandItem
                key={inv.id}
                value={`${inv.coupleNames} ${inv.id} ${inv.creatorEmail}`}
                onSelect={() => goToInvitation(inv.id)}
              >
                <Mail />
                <span>{inv.coupleNames}</span>
                <span className="ml-auto text-xs text-muted-foreground">{inv.creatorEmail}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="사용자">
            {users.map((u) => (
              <CommandItem
                key={u.id}
                value={`${u.name} ${u.email}`}
                onSelect={() => goToUser(u.email)}
              >
                <User />
                <span>{u.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{u.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
