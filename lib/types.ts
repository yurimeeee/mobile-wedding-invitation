export interface EditorState {
  template: TemplateType
  weddingInfo: WeddingInfo
  musicSettings: MusicSettings
  gallery: GalleryImage[]
  calendarSettings: CalendarSettings
  shareSettings: ShareSettings
  privacySettings: PrivacySettings
  slug: string
}

export type TemplateType =
  | 'classic-elegant' 
  | 'modern-minimal' 
  | 'floral-romantic' 
  | 'dark-luxury' 
  | 'korean-traditional'

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
  groomParentContact: string
  brideParentContact: string
  groomBankAccount: string
  brideBankAccount: string
  groomBankName: string
  brideBankName: string
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
  groomParentContact: '',
  brideParentContact: '',
  groomBankAccount: '',
  brideBankAccount: '',
  groomBankName: '',
  brideBankName: '',
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
]

// 출처: Wikimedia Commons (Musopen 녹음 포함) — 전부 퍼블릭 도메인/CC0, 저작권 표시 불필요
export const musicTracks = [
  { id: 'romantic-piano', name: 'Romantic Piano', nameKr: '로맨틱 피아노', url: '/assets/music/romantic-piano.mp3' },
  { id: 'string-quartet', name: 'String Quartet', nameKr: '현악 4중주', url: '/assets/music/string-quartet.mp3' },
  { id: 'acoustic-guitar', name: 'Acoustic Guitar', nameKr: '어쿠스틱 기타', url: '/assets/music/acoustic-guitar.mp3' },
  { id: 'classical-waltz', name: 'Classical Waltz', nameKr: '클래식 왈츠', url: '/assets/music/classical-waltz.mp3' },
]
