'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { auth } from '@/lib/firebase'
import { saveInvitation, loadInvitation } from '@/lib/invitation-service'
import {
  type EditorState,
  type TemplateType,
  type WeddingInfo,
  type MusicSettings,
  type GalleryImage,
  type CalendarSettings,
  type ShareSettings,
  defaultWeddingInfo,
  defaultMusicSettings,
  defaultCalendarSettings,
  defaultShareSettings,
  templates,
} from '@/lib/types'

export type { EditorState }

const initialState: EditorState = {
  template: 'classic-elegant',
  weddingInfo: defaultWeddingInfo,
  musicSettings: defaultMusicSettings,
  gallery: [],
  calendarSettings: defaultCalendarSettings,
  shareSettings: defaultShareSettings,
  slug: '',
}

export function useEditorState(invitationId: string) {
  const [state, setState] = useState<EditorState>(initialState)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(invitationId !== 'new')

  // Ref to track latest state without triggering effects
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // editCount increments only on user edits — prevents auto-save loop after gallery URL updates
  const [editCount, setEditCount] = useState(0)
  const bumpEdit = () => setEditCount((c) => c + 1)

  // Load existing invitation from Firestore
  useEffect(() => {
    if (invitationId === 'new') return
    loadInvitation(invitationId)
      .then((data) => {
        if (data) setState(data)
      })
      .catch(() => toast.error('청첩장을 불러오는 데 실패했습니다'))
      .finally(() => setIsLoading(false))
  }, [invitationId])

  // Auto-save (debounced, triggers only on user edits)
  useEffect(() => {
    if (!editCount || invitationId === 'new' || isLoading) return
    const user = auth.currentUser
    if (!user) return

    const timer = setTimeout(async () => {
      setIsSaving(true)
      try {
        const updatedGallery = await saveInvitation(user.uid, invitationId, stateRef.current, 'draft')
        setState((prev) => ({ ...prev, gallery: updatedGallery }))
        setLastSaved(new Date())
      } catch {
        // silent fail for auto-save
      } finally {
        setIsSaving(false)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [editCount, invitationId, isLoading])

  // --- State updaters ---
  const setTemplate = (template: TemplateType) => {
    setState((prev) => ({ ...prev, template }))
    bumpEdit()
  }

  const updateWeddingInfo = (updates: Partial<WeddingInfo>) => {
    setState((prev) => ({ ...prev, weddingInfo: { ...prev.weddingInfo, ...updates } }))
    bumpEdit()
  }

  const setMusicSettings = (settings: MusicSettings) => {
    setState((prev) => ({ ...prev, musicSettings: settings }))
    bumpEdit()
  }

  const addGalleryImage = (image: GalleryImage) => {
    setState((prev) => ({ ...prev, gallery: [...prev.gallery, image] }))
    bumpEdit()
  }

  const removeGalleryImage = (id: string) => {
    setState((prev) => ({ ...prev, gallery: prev.gallery.filter((img) => img.id !== id) }))
    bumpEdit()
  }

  const reorderGallery = (images: GalleryImage[]) => {
    setState((prev) => ({ ...prev, gallery: images }))
    bumpEdit()
  }

  const updateCalendarSettings = (updates: Partial<CalendarSettings>) => {
    setState((prev) => ({ ...prev, calendarSettings: { ...prev.calendarSettings, ...updates } }))
    bumpEdit()
  }

  const updateShareSettings = (updates: Partial<ShareSettings>) => {
    setState((prev) => ({ ...prev, shareSettings: { ...prev.shareSettings, ...updates } }))
    bumpEdit()
  }

  const updateSlug = (slug: string) => {
    setState((prev) => ({ ...prev, slug }))
    bumpEdit()
  }

  // --- Manual save / publish ---
  const saveDraft = async () => {
    const user = auth.currentUser
    if (!user || invitationId === 'new') return
    setIsActionLoading(true)
    try {
      const updatedGallery = await saveInvitation(user.uid, invitationId, stateRef.current, 'draft')
      setState((prev) => ({ ...prev, gallery: updatedGallery }))
      setLastSaved(new Date())
      toast.success('임시저장되었습니다')
    } catch {
      toast.error('저장에 실패했습니다')
    } finally {
      setIsActionLoading(false)
    }
  }

  const publish = async (): Promise<string | null> => {
    const user = auth.currentUser
    if (!user || invitationId === 'new') return null
    setIsActionLoading(true)
    try {
      const updatedGallery = await saveInvitation(user.uid, invitationId, stateRef.current, 'published')
      setState((prev) => ({ ...prev, gallery: updatedGallery }))
      setLastSaved(new Date())
      return invitationId
    } catch {
      toast.error('발행에 실패했습니다')
      return null
    } finally {
      setIsActionLoading(false)
    }
  }

  return {
    state,
    isSaving,
    lastSaved,
    isLoading,
    isActionLoading,
    saveDraft,
    publish,
    setTemplate,
    updateWeddingInfo,
    setMusicSettings,
    addGalleryImage,
    removeGalleryImage,
    reorderGallery,
    updateCalendarSettings,
    updateShareSettings,
    updateSlug,
    templates,
  }
}
