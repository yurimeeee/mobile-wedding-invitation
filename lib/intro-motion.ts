import type { IntroStyle } from './types'

// Shared by the real guest page and the editor's live preview, so what you see
// while picking a style in the editor is exactly what a guest sees on load.
export function getIntroMotion(style: IntroStyle | undefined) {
  switch (style) {
    case 'slide-up':
      return { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: 'easeOut' as const } }
    case 'zoom':
      return { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5, ease: 'easeOut' as const } }
    case 'none':
      return { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
    case 'fade':
    default:
      return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6, ease: 'easeInOut' as const } }
  }
}
