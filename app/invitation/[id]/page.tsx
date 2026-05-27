'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Heart } from 'lucide-react'
import { loadInvitation } from '@/lib/invitation-service'
import { type EditorState } from '@/lib/types'
import { InvitationFullView } from '@/components/invitation/invitation-full-view'

export default function InvitationViewPage() {
  const { id } = useParams<{ id: string }>()
  const [state, setState] = useState<EditorState | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    loadInvitation(id)
      .then((data) => {
        if (data) setState(data)
        else setNotFound(true)
      })
      .catch((err) => {
        console.error('[invitation view] load error:', err)
        setNotFound(true)
      })
  }, [id])

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Heart className="h-12 w-12 opacity-20" />
        <p className="text-sm">청첩장을 찾을 수 없습니다</p>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <InvitationFullView state={state} invitationId={id} />
}
