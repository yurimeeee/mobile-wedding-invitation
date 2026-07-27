'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Heart } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { loadInvitation, loadInvitationBySlug } from '@/lib/invitation-service'
import { type EditorState } from '@/lib/types'
import { getIntroMotion } from '@/lib/intro-motion'
import { InvitationFullView } from '@/components/invitation/invitation-full-view'

export default function InvitationViewPage() {
  const { id } = useParams<{ id: string }>()
  const [state, setState] = useState<EditorState | null>(null)
  const [resolvedId, setResolvedId] = useState<string>('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return

    async function load() {
      // 1. 슬러그로 먼저 조회
      try {
        const bySlug = await loadInvitationBySlug(id)
        if (bySlug) {
          setState(bySlug.state)
          setResolvedId(bySlug.id)
          return
        }
      } catch (e) {
        console.error('[invitation] slug lookup error:', e)
      }

      // 2. 문서 ID로 fallback
      try {
        const byId = await loadInvitation(id)
        if (byId) {
          setState(byId)
          setResolvedId(id)
          return
        }
      } catch (e) {
        console.error('[invitation] id lookup error:', e)
      }

      setNotFound(true)
    }

    load()
  }, [id])

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Heart className="h-12 w-12 opacity-20" />
        <p className="text-sm">청첩장을 찾을 수 없습니다</p>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {!state ? (
        <motion.div
          key="loading"
          className="min-h-screen flex flex-col items-center justify-center gap-4"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Heart className="h-8 w-8 text-accent" fill="currentColor" />
          </motion.div>
          <motion.p
            className="text-sm text-muted-foreground"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            청첩장을 불러오는 중...
          </motion.p>
        </motion.div>
      ) : (
        <motion.div key="content" {...getIntroMotion(state.introStyle)}>
          <InvitationFullView state={state} invitationId={resolvedId} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
