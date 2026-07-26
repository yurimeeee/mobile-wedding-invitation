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
  type PrivacySettings,
  type SectionInstance,
  type FreeElement,
  type CanvasBackground,
  type CustomLayout,
  defaultWeddingInfo,
  defaultMusicSettings,
  defaultCalendarSettings,
  defaultShareSettings,
  defaultPrivacySettings,
  defaultCustomLayout,
  templates,
} from '@/lib/types'

// Consecutive customLayout edits fired within this window (e.g. every tick of a
// slider drag, or a Konva drag/transform gesture) collapse into a single undo
// step instead of one step per tick.
const HISTORY_COMMIT_DELAY_MS = 400
const MAX_HISTORY = 50

export type { EditorState }

const initialState: EditorState = {
  template: 'classic-elegant',
  weddingInfo: defaultWeddingInfo,
  musicSettings: defaultMusicSettings,
  gallery: [],
  calendarSettings: defaultCalendarSettings,
  shareSettings: defaultShareSettings,
  privacySettings: defaultPrivacySettings,
  slug: '',
  mode: 'template',
  customLayout: defaultCustomLayout,
}

export function useEditorState(invitationId: string) {
  const [state, setState] = useState<EditorState>(initialState)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(!!invitationId)

  // Ref to track latest state without triggering effects
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // editCount increments only on user edits — prevents auto-save loop after gallery URL updates
  const [editCount, setEditCount] = useState(0)
  const bumpEdit = () => setEditCount((c) => c + 1)

  // --- Undo/redo history for the custom layout editor (sections, background, free elements) ---
  const [history, setHistory] = useState<{ past: CustomLayout[]; future: CustomLayout[] }>({ past: [], future: [] })
  const pendingSnapshotRef = useRef<CustomLayout | null>(null)
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current)
  }, [])

  const scheduleHistoryCommit = (prevLayout: CustomLayout) => {
    if (!pendingSnapshotRef.current) pendingSnapshotRef.current = prevLayout
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current)
    historyTimerRef.current = setTimeout(() => {
      historyTimerRef.current = null
      const snapshot = pendingSnapshotRef.current
      pendingSnapshotRef.current = null
      if (!snapshot) return
      setHistory((h) => ({ past: [...h.past, snapshot].slice(-MAX_HISTORY), future: [] }))
    }, HISTORY_COMMIT_DELAY_MS)
  }

  // Folds an in-flight (not yet debounced) edit into `past` immediately, so
  // undo/redo triggered mid-gesture doesn't lose or misplace that edit.
  const flushPendingHistory = () => {
    if (historyTimerRef.current) {
      clearTimeout(historyTimerRef.current)
      historyTimerRef.current = null
    }
    const snapshot = pendingSnapshotRef.current
    pendingSnapshotRef.current = null
    if (snapshot) {
      setHistory((h) => ({ past: [...h.past, snapshot].slice(-MAX_HISTORY), future: [] }))
    }
  }

  const undo = () => {
    const hasPending = pendingSnapshotRef.current !== null
    if (!hasPending && history.past.length === 0) return
    flushPendingHistory()
    setHistory((h) => {
      if (h.past.length === 0) return h
      const prevLayout = h.past[h.past.length - 1]
      const currentLayout = stateRef.current.customLayout ?? defaultCustomLayout
      setState((s) => ({ ...s, customLayout: prevLayout }))
      return { past: h.past.slice(0, -1), future: [currentLayout, ...h.future] }
    })
    bumpEdit()
  }

  const redo = () => {
    if (history.future.length === 0) return
    setHistory((h) => {
      if (h.future.length === 0) return h
      const nextLayout = h.future[0]
      const currentLayout = stateRef.current.customLayout ?? defaultCustomLayout
      setState((s) => ({ ...s, customLayout: nextLayout }))
      return { past: [...h.past, currentLayout], future: h.future.slice(1) }
    })
    bumpEdit()
  }

  // Load existing invitation from Firestore
  useEffect(() => {
    if (!invitationId) return
    loadInvitation(invitationId)
      .then((data) => {
        if (data) {
          setState(data)
          setHistory({ past: [], future: [] })
        }
      })
      .catch(() => toast.error('청첩장을 불러오는 데 실패했습니다'))
      .finally(() => setIsLoading(false))
  }, [invitationId])

  // Auto-save (debounced, triggers only on user edits)
  useEffect(() => {
    if (!editCount || !invitationId || isLoading) return
    const user = auth.currentUser
    if (!user) return

    const timer = setTimeout(async () => {
      setIsSaving(true)
      try {
        const { gallery, musicSettings, shareSettings } = await saveInvitation(user.uid, invitationId, stateRef.current, 'draft')
        setState((prev) => ({ ...prev, gallery, musicSettings, shareSettings }))
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

  const updatePrivacySettings = (updates: Partial<PrivacySettings>) => {
    setState((prev) => ({ ...prev, privacySettings: { ...prev.privacySettings, ...updates } }))
    bumpEdit()
  }

  const updateSlug = (slug: string) => {
    setState((prev) => ({ ...prev, slug }))
    bumpEdit()
  }

  const reorderSections = (sections: SectionInstance[]) => {
    scheduleHistoryCommit(stateRef.current.customLayout ?? defaultCustomLayout)
    setState((prev) => ({
      ...prev,
      customLayout: { ...(prev.customLayout ?? defaultCustomLayout), sections },
    }))
    bumpEdit()
  }

  const toggleSectionVisibility = (id: string) => {
    scheduleHistoryCommit(stateRef.current.customLayout ?? defaultCustomLayout)
    setState((prev) => {
      const layout = prev.customLayout ?? defaultCustomLayout
      return {
        ...prev,
        customLayout: {
          ...layout,
          sections: layout.sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
        },
      }
    })
    bumpEdit()
  }

  const setBackground = (background: CanvasBackground) => {
    scheduleHistoryCommit(stateRef.current.customLayout ?? defaultCustomLayout)
    setState((prev) => ({
      ...prev,
      customLayout: { ...(prev.customLayout ?? defaultCustomLayout), background },
    }))
    bumpEdit()
  }

  const addFreeElement = (element: FreeElement) => {
    scheduleHistoryCommit(stateRef.current.customLayout ?? defaultCustomLayout)
    setState((prev) => {
      const layout = prev.customLayout ?? defaultCustomLayout
      return { ...prev, customLayout: { ...layout, freeElements: [...layout.freeElements, element] } }
    })
    bumpEdit()
  }

  const updateFreeElement = (id: string, updates: Partial<FreeElement>) => {
    scheduleHistoryCommit(stateRef.current.customLayout ?? defaultCustomLayout)
    setState((prev) => {
      const layout = prev.customLayout ?? defaultCustomLayout
      return {
        ...prev,
        customLayout: {
          ...layout,
          freeElements: layout.freeElements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
        },
      }
    })
    bumpEdit()
  }

  const removeFreeElement = (id: string) => {
    scheduleHistoryCommit(stateRef.current.customLayout ?? defaultCustomLayout)
    setState((prev) => {
      const layout = prev.customLayout ?? defaultCustomLayout
      return { ...prev, customLayout: { ...layout, freeElements: layout.freeElements.filter((el) => el.id !== id) } }
    })
    bumpEdit()
  }

  // --- Manual save / publish ---
  const saveDraft = async () => {
    const user = auth.currentUser
    if (!user || !invitationId) return
    setIsActionLoading(true)
    try {
      const { gallery, musicSettings, shareSettings } = await saveInvitation(user.uid, invitationId, stateRef.current, 'draft')
      setState((prev) => ({ ...prev, gallery, musicSettings, shareSettings }))
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
    if (!user || !invitationId) return null
    setIsActionLoading(true)
    try {
      const { gallery, musicSettings, shareSettings } = await saveInvitation(user.uid, invitationId, stateRef.current, 'published')
      setState((prev) => ({ ...prev, gallery, musicSettings, shareSettings }))
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
    updatePrivacySettings,
    updateSlug,
    reorderSections,
    toggleSectionVisibility,
    setBackground,
    addFreeElement,
    updateFreeElement,
    removeFreeElement,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    templates,
  }
}
