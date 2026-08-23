'use client'

import { type EditorState, type GalleryImage, musicTracks, defaultCustomLayout } from '@/lib/types'
import { resolvePreviewStyle } from '@/lib/preview-style'
import { fullViewSectionRegistry } from '@/components/invitation/full-view/section-registry'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Music, X, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

// Konva touches the DOM at import time, so it must never be part of the server bundle.
const FreeElementCanvas = dynamic(
  () => import('@/components/editor/custom/free-element-canvas').then((m) => m.FreeElementCanvas),
  { ssr: false }
)

interface InvitationFullViewProps {
  state: EditorState
  invitationId: string
  // 관리자 미리보기 등 이미 접근 권한이 확인된 컨텍스트에서 잠금 화면을 건너뛴다.
  bypassLock?: boolean
}

// ─── Gallery Lightbox ─────────────────────────────────────────────────────────
function GalleryLightbox({ images, initialIndex, onClose }: {
  images: GalleryImage[]
  initialIndex: number
  onClose: () => void
}) {
  const [current, setCurrent] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), [])
  const next = useCallback(() => setCurrent(c => Math.min(images.length - 1, c + 1)), [images.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [prev, next, onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const dx = e.changedTouches[0].clientX - touchStartX.current
        if (dx > 50) prev()
        else if (dx < -50) next()
        touchStartX.current = null
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/60 text-sm">{current + 1} / {images.length}</span>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Image */}
      <div
        className="relative flex-1 flex items-center justify-center px-4 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[current].url}
          alt=""
          fill
          sizes="100vw"
          className="object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Nav arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            disabled={current === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            disabled={current === images.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 transition-colors"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-6 pt-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'rounded-full transition-all',
                i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Lock screen ──────────────────────────────────────────────────────────────
// 비밀번호는 서버(/api/invitation-lock)에서만 대조한다 — 클라이언트에 정답을 내려주면
// 페이지 소스나 Firestore 클라이언트 SDK로 그대로 읽힐 수 있기 때문이다.
function LockScreen({ invitationId, onUnlock }: { invitationId: string; onUnlock: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setChecking(true)
    setError(null)
    try {
      const res = await fetch('/api/invitation-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invitationId, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        onUnlock()
      } else if (res.status === 429) {
        setError(data.error || '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.')
      } else {
        setError('비밀번호가 올바르지 않습니다.')
      }
    } catch {
      setError('확인 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen max-w-[393px] mx-auto flex flex-col items-center justify-center px-8 bg-background">
      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-5">
        <Lock className="h-5 w-5 text-accent" />
      </div>
      <h1 className="font-serif text-xl font-semibold mb-2">잠긴 청첩장이에요</h1>
      <p className="text-sm text-muted-foreground mb-8 text-center">비밀번호를 입력하면 청첩장을 볼 수 있어요.</p>
      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <Input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null) }}
          placeholder="비밀번호"
          autoFocus
        />
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
        <Button type="submit" className="w-full" disabled={checking}>{checking ? '확인 중...' : '확인'}</Button>
      </form>
    </div>
  )
}

// ─── Section stage (measures content height for the free-element overlay) ─────
function SectionStage({ state, invitationId, invitationUrl, onOpenLightbox }: {
  state: EditorState
  invitationId: string
  invitationUrl: string
  onOpenLightbox: (index: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const style = resolvePreviewStyle(state)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const sections = [...(state.customLayout?.sections ?? defaultCustomLayout.sections)]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)
  const elements = state.customLayout?.freeElements ?? []

  return (
    <div ref={containerRef} className="relative">
      {sections.map((section) => {
        const Block = fullViewSectionRegistry[section.kind]
        const isCover = section.kind === 'cover'
        return (
          <motion.div
            key={section.id}
            initial={isCover ? { opacity: 0, scale: 0.96 } : { opacity: 0, y: 24 }}
            {...(isCover
              ? { animate: { opacity: 1, scale: 1 } }
              : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 } })}
            transition={isCover ? { duration: 0.7, delay: 0.15, ease: 'easeOut' } : { duration: 0.4, ease: 'easeOut' }}
          >
            <Block
              state={state}
              style={style}
              invitationId={invitationId}
              invitationUrl={invitationUrl}
              onOpenLightbox={onOpenLightbox}
            />
          </motion.div>
        )
      })}

      {/* Footer */}
      <div className="px-8">
        <div className="h-px mb-6" style={{ background: style.divider }} />
        <p className="text-center text-xs pb-10" style={{ color: style.text, opacity: 0.3 }}>WedInvite로 만들었어요</p>
      </div>

      {/* Free elements are decorative only on the guest page — no drag/resize here */}
      {elements.length > 0 && (
        <FreeElementCanvas
          elements={elements}
          canvasWidth={size.width}
          canvasHeight={size.height}
          interactive={false}
          selectedIds={[]}
          onSelect={() => {}}
          onChange={() => {}}
        />
      )}
    </div>
  )
}

// ─── Main full view ───────────────────────────────────────────────────────────
export function InvitationFullView({ state, invitationId, bypassLock }: InvitationFullViewProps) {
  const { musicSettings, privacySettings } = state
  const style = resolvePreviewStyle(state)
  const invitationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/invitation/${invitationId}`
    : ''
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const isLocked = privacySettings.lockEnabled && !unlocked && !bypassLock

  // 확대방지: 핀치 줌과 뷰포트 확대를 막는다
  useEffect(() => {
    if (!privacySettings.zoomPrevention) return

    const viewportMeta = document.querySelector('meta[name="viewport"]')
    const previousContent = viewportMeta?.getAttribute('content') ?? null
    viewportMeta?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')

    const preventPinch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    let lastTouchEnd = 0
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) e.preventDefault()
      lastTouchEnd = now
    }

    document.addEventListener('touchmove', preventPinch, { passive: false })
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false })

    return () => {
      if (previousContent !== null) viewportMeta?.setAttribute('content', previousContent)
      document.removeEventListener('touchmove', preventPinch)
      document.removeEventListener('touchend', preventDoubleTapZoom)
    }
  }, [privacySettings.zoomPrevention])

  const trackUrl = musicSettings.customUrl || musicTracks.find(t => t.id === musicSettings.track)?.url || ''
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicSettings.volume / 100
  }, [musicSettings.volume])

  useEffect(() => {
    if (!musicSettings.enabled || !musicSettings.autoPlay || !trackUrl || !audioRef.current) return
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
  }, [musicSettings.enabled, musicSettings.autoPlay, trackUrl])

  const toggleMusic = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }

  if (isLocked) {
    return <LockScreen invitationId={invitationId} onUnlock={() => setUnlocked(true)} />
  }

  return (
    <div className="min-h-screen max-w-[393px] mx-auto" style={{ background: style.bg, color: style.text }}>
      <SectionStage
        state={state}
        invitationId={invitationId}
        invitationUrl={invitationUrl}
        onOpenLightbox={setLightboxIndex}
      />

      {lightboxIndex !== null && (
        <GalleryLightbox
          images={state.gallery}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* BGM */}
      {musicSettings.enabled && trackUrl && (
        <>
          <audio ref={audioRef} src={trackUrl} loop preload="auto" />
          <button
            onClick={toggleMusic}
            className="fixed bottom-6 right-6 p-3 rounded-full shadow-lg"
            style={{ background: style.isDark ? '#2a2a2a' : 'white' }}
          >
            <Music className={cn('h-5 w-5', isPlaying && 'animate-pulse')} style={{ color: style.text }} />
          </button>
        </>
      )}
    </div>
  )
}
