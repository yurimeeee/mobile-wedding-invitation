export interface EditorState {
  template: TemplateType
  weddingInfo: WeddingInfo
  musicSettings: MusicSettings
  gallery: GalleryImage[]
  calendarSettings: CalendarSettings
  shareSettings: ShareSettings
  privacySettings: PrivacySettings
  slug: string
  mode: EditorMode
  customLayout?: CustomLayout
  introStyle?: IntroStyle
}

// ─── Custom editor (free-form section/element editor) ─────────────────────

export type EditorMode = 'template' | 'custom'

// 청첩장 첫 진입 시 콘텐츠가 나타나는 방식 — 로딩 인디케이터(하트 펄스)는 스타일과
// 무관하게 동일하게 유지하고, 콘텐츠가 준비된 뒤의 등장 트랜지션만 바뀐다.
export type IntroStyle = 'fade' | 'slide-up' | 'zoom' | 'none'

export const introStyleLabels: Record<IntroStyle, { name: string; description: string }> = {
  fade: { name: '페이드인', description: '은은하게 스며들 듯 나타나요' },
  'slide-up': { name: '슬라이드업', description: '아래에서 위로 올라오며 나타나요' },
  zoom: { name: '확대 등장', description: '살짝 작은 상태에서 커지며 나타나요' },
  none: { name: '즉시 표시', description: '효과 없이 바로 보여줘요' },
}

export type SectionKind =
  | 'cover' | 'greeting' | 'calendar' | 'gallery'
  | 'location' | 'account' | 'guestbook' | 'rsvp' | 'share'

export interface SectionInstance {
  id: string
  kind: SectionKind
  order: number
  visible: boolean
}

export type FreeElementType = 'sticker' | 'image' | 'text' | 'shape'

export type TextFontFamily = 'sans' | 'serif'
export type TextAlign = 'left' | 'center' | 'right'
export type ShapeKind = 'line' | 'rect' | 'circle' | 'heart'

export const textFontFamilyMap: Record<TextFontFamily, string> = {
  sans: 'Geist, system-ui, sans-serif',
  serif: "'Noto Serif KR', 'Times New Roman', serif",
}

export const shapeKindLabels: Record<ShapeKind, string> = {
  line: '라인',
  rect: '사각형',
  circle: '원',
  heart: '하트',
}

export interface FreeElement {
  id: string
  type: FreeElementType
  src?: string
  text?: string
  // x/y/width/height are % of the canvas reference frame (0-100), not px —
  // this keeps element position resolution-independent between the editor
  // canvas and the guest's actual device width.
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  opacity: number
  locked: boolean
  // undefined/true = visible; only false hides it. Optional so elements saved
  // before this field existed keep rendering as before.
  visible?: boolean
  // Elements sharing the same groupId move/resize together as one unit.
  // Nullable (not just optional) because ungrouping writes `null` explicitly —
  // Firestore's setDoc rejects literal `undefined` field values.
  groupId?: string | null
  // text-only styling — all optional so elements saved before this field
  // existed keep rendering with the old hardcoded defaults.
  color?: string
  fontSize?: number // % of canvas width, same unit convention as width/height
  fontFamily?: TextFontFamily
  bold?: boolean
  italic?: boolean
  align?: TextAlign
  // shape-only — which primitive to draw; fill color reuses `color` above
  shapeKind?: ShapeKind
  // drop shadow — on/off only, uses one fixed preset rather than exposing
  // blur/offset knobs. Applies to every element type.
  shadow?: boolean
  // border/stroke — not offered for shapeKind 'line', since a line already
  // uses its own `color` as its stroke and a second stroke would conflict.
  borderEnabled?: boolean
  borderColor?: string
  borderWidth?: number // % of canvas width, same unit convention as fontSize
}

export interface CanvasBackground {
  type: 'color' | 'gradient' | 'image'
  value: string
}

export interface CustomLayout {
  sections: SectionInstance[]
  freeElements: FreeElement[]
  background: CanvasBackground
}

export const sectionKindLabels: Record<SectionKind, string> = {
  cover: '메인 커버',
  greeting: '인사말',
  calendar: '일시/캘린더',
  gallery: '갤러리',
  location: '오시는 길',
  account: '마음 전하는 곳',
  guestbook: '방명록',
  rsvp: '참석 여부',
  share: '공유',
}

// 사용자가 직접 업로드하는 요소(스티커/이미지) — 업로드한 본인에게만 보이고 사용 가능하다
// (Firestore: users/{uid}/customElements, Storage: users/{uid}/elements).
export interface CustomElementAsset {
  id: string
  url: string
  name: string
  width: number
  height: number
  createdAt: string
}

export const MAX_CUSTOM_ELEMENT_FILE_SIZE = 2 * 1024 * 1024 // 2MB
export const MAX_CUSTOM_ELEMENT_DIMENSION = 2000 // px (width and height)

export const defaultCustomLayout: CustomLayout = {
  sections: (
    ['cover', 'greeting', 'calendar', 'gallery', 'location', 'account', 'rsvp', 'guestbook', 'share'] as SectionKind[]
  ).map((kind, order) => ({
    id: `section-${kind}`,
    kind,
    order,
    visible: true,
  })),
  freeElements: [],
  // value: '' means "no override, use the selected template's background"
  background: { type: 'color', value: '' },
}

export type TemplateType =
  | 'classic-elegant'
  | 'modern-minimal'
  | 'floral-romantic'
  | 'dark-luxury'
  | 'korean-traditional'
  | 'vintage-forest'

export interface WeddingInfo {
  groomLastName: string
  groomFirstName: string
  groomLastNameKr: string
  groomFirstNameKr: string
  brideLastName: string
  brideFirstName: string
  brideLastNameKr: string
  brideFirstNameKr: string
  mainPhrase: string
  weddingDate: string
  weddingTime: string
  ceremonyHall: string
  venue: string
  address: string
  latitude: number
  longitude: number
  transportGuide: string
  groomContact: string
  brideContact: string
  groomFatherName: string
  groomMotherName: string
  brideFatherName: string
  brideMotherName: string
  groomFatherDeceased: boolean
  groomMotherDeceased: boolean
  brideFatherDeceased: boolean
  brideMotherDeceased: boolean
  groomParentContact: string
  brideParentContact: string
  groomBankAccount: string
  brideBankAccount: string
  groomBankName: string
  brideBankName: string
  showDeceasedMark: boolean
  brideFirst: boolean
}

// 고인이신 부모님 성함 표시: showDeceasedMark가 켜져 있으면 국화 아이콘, 아니면 "故" 텍스트
export function formatParentName(name: string, deceased: boolean, showDeceasedMark: boolean): string {
  if (!name || !deceased) return name
  return showDeceasedMark ? `🌼 ${name}` : `故 ${name}`
}

export interface GalleryImage {
  id: string
  url: string
  caption?: string
  order: number
}

export interface CalendarSettings {
  calendarDisplay: boolean
  countdownDisplay: boolean
  dDayDisplay: boolean
}

export interface ShareSettings {
  kakaoTitle: string
  kakaoDesc: string
  kakaoImg: string
  linkTitle: string
  linkDesc: string
  linkImg: string
}

export interface MusicSettings {
  enabled: boolean
  autoPlay: boolean
  volume: number
  track: string
  customUrl?: string
}

export interface PrivacySettings {
  lockEnabled: boolean
  lockPassword: string
  zoomPrevention: boolean
}

export interface RSVPSettings {
  enabled: boolean
  deadline: string
  maxGuests: number
}

export interface Invitation {
  id: string
  title: string
  template: TemplateType
  weddingInfo: WeddingInfo
  gallery: GalleryImage[]
  musicSettings: MusicSettings
  rsvpSettings: RSVPSettings
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  thumbnail?: string
  mode?: EditorMode
  customLayout?: CustomLayout
}

export const defaultWeddingInfo: WeddingInfo = {
  groomLastName: '',
  groomFirstName: '',
  groomLastNameKr: '',
  groomFirstNameKr: '',
  brideLastName: '',
  brideFirstName: '',
  brideLastNameKr: '',
  brideFirstNameKr: '',
  mainPhrase: '서로 다른 두 사람이\n사랑으로 하나가 되는 날',
  weddingDate: '',
  weddingTime: '',
  ceremonyHall: '',
  venue: '',
  address: '',
  transportGuide: '',
  groomContact: '',
  brideContact: '',
  groomFatherName: '',
  groomMotherName: '',
  brideFatherName: '',
  brideMotherName: '',
  groomFatherDeceased: false,
  groomMotherDeceased: false,
  brideFatherDeceased: false,
  brideMotherDeceased: false,
  groomParentContact: '',
  brideParentContact: '',
  groomBankAccount: '',
  brideBankAccount: '',
  groomBankName: '',
  brideBankName: '',
  showDeceasedMark: false,
  brideFirst: false,
  latitude: 0,
  longitude: 0,
}

export const defaultCalendarSettings: CalendarSettings = {
  calendarDisplay: true,
  countdownDisplay: true,
  dDayDisplay: true,
}

export const defaultShareSettings: ShareSettings = {
  kakaoTitle: '',
  kakaoDesc: '',
  kakaoImg: '',
  linkTitle: '',
  linkDesc: '',
  linkImg: '',
}

export const defaultMusicSettings: MusicSettings = {
  enabled: true,
  autoPlay: false,
  volume: 50,
  track: 'romantic-piano',
}

export const defaultPrivacySettings: PrivacySettings = {
  lockEnabled: false,
  lockPassword: '',
  zoomPrevention: false,
}

export const defaultRSVPSettings: RSVPSettings = {
  enabled: true,
  deadline: '2026-06-10',
  maxGuests: 200,
}

export const templates: { id: TemplateType; name: string; nameKr: string; colors: string[] }[] = [
  { id: 'classic-elegant', name: 'Classic Elegant', nameKr: '클래식 엘레강스', colors: ['#f5f5dc', '#d4af37', '#1a1a1a'] },
  { id: 'modern-minimal', name: 'Modern Minimal', nameKr: '모던 미니멀', colors: ['#ffffff', '#000000', '#e5e5e5'] },
  { id: 'floral-romantic', name: 'Floral Romantic', nameKr: '플로럴 로맨틱', colors: ['#fff5f5', '#d4a5a5', '#4a4a4a'] },
  { id: 'dark-luxury', name: 'Dark Luxury', nameKr: '다크 럭셔리', colors: ['#1a1a1a', '#d4af37', '#f5f5f5'] },
  { id: 'korean-traditional', name: 'Korean Traditional', nameKr: '한국 전통', colors: ['#f8f4e8', '#8b4513', '#2d2d2d'] },
  { id: 'vintage-forest', name: 'Vintage Forest', nameKr: '빈티지 포레스트', colors: ['#f7f3ec', '#8b6f47', '#2e2a24'] },
]

// 출처: Wikimedia Commons (Musopen 녹음 포함) — 전부 퍼블릭 도메인/CC0, 저작권 표시 불필요
export const musicTracks = [
  { id: 'romantic-piano', name: 'Romantic Piano', nameKr: '로맨틱 피아노', url: '/assets/music/romantic-piano.mp3' },
  { id: 'string-quartet', name: 'String Quartet', nameKr: '현악 4중주', url: '/assets/music/string-quartet.mp3' },
  { id: 'acoustic-guitar', name: 'Acoustic Guitar', nameKr: '어쿠스틱 기타', url: '/assets/music/acoustic-guitar.mp3' },
  { id: 'classical-waltz', name: 'Classical Waltz', nameKr: '클래식 왈츠', url: '/assets/music/classical-waltz.mp3' },
]
