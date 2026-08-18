'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { recordInvitationView } from '@/lib/invitation-service'
import { type EditorState } from '@/lib/types'
import { getIntroMotion } from '@/lib/intro-motion'
import { InvitationFullView } from '@/components/invitation/invitation-full-view'

interface InvitationViewClientProps {
  state: EditorState
  invitationId: string
}

export function InvitationViewClient({ state, invitationId }: InvitationViewClientProps) {
  useEffect(() => {
    recordInvitationView(invitationId)
  }, [invitationId])

  return (
    <motion.div {...getIntroMotion(state.introStyle)}>
      <InvitationFullView state={state} invitationId={invitationId} />
    </motion.div>
  )
}
