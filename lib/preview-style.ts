import type { EditorState, TemplateType } from './types'

export interface PreviewStyleConfig {
  bg: string
  text: string
  divider: string
  sectionBg: string
  isDark: boolean
  accent: string
}

export const templateConfig: Record<TemplateType, Omit<PreviewStyleConfig, 'accent'>> = {
  'classic-elegant': {
    bg: '#FCFDF8',
    text: '#261C1D',
    divider: '#DDD2C8',
    sectionBg: 'rgba(0,0,0,0.04)',
    isDark: false,
  },
  'modern-minimal': {
    bg: '#FFFFFF',
    text: '#2D2D2D',
    divider: '#E5E5E5',
    sectionBg: 'rgba(0,0,0,0.04)',
    isDark: false,
  },
  'floral-romantic': {
    bg: '#F8F4EB',
    text: '#261C1D',
    divider: '#E1DBD5',
    sectionBg: 'rgba(0,0,0,0.04)',
    isDark: false,
  },
  'dark-luxury': {
    bg: '#181818',
    text: '#F5F5F0',
    divider: '#333',
    sectionBg: 'rgba(255,255,255,0.06)',
    isDark: true,
  },
  'korean-traditional': {
    bg: '#F8F4EB',
    text: '#261C1D',
    divider: '#E1DBD5',
    sectionBg: 'rgba(0,0,0,0.04)',
    isDark: false,
  },
}

// customLayout.background는 template의 나머지 팔레트(텍스트/구분선/섹션 배경)는 그대로 두고
// 배경색만 덮어쓴다. value가 빈 문자열이면 "덮어쓰지 않음" — 커스터마이즈한 적 없는 청첩장은
// 선택된 template의 원래 배경을 그대로 쓴다.
export function resolvePreviewStyle(state: EditorState): PreviewStyleConfig {
  const base = templateConfig[state.template]
  const accent = base.isDark ? '#d4af37' : '#c47a85'
  const background = state.customLayout?.background

  const bg = background?.type === 'color' && background.value ? background.value : base.bg
  return { ...base, bg, accent }
}
