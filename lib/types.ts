export interface EditorState {
  template: TemplateType
  weddingInfo: WeddingInfo
  musicSettings: MusicSettings
  gallery: GalleryImage[]
  calendarSettings: CalendarSettings
  shareSettings: ShareSettings
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
  groomLastName: 'Kim',
  groomFirstName: 'Minho',
  groomLastNameKr: '김',
  groomFirstNameKr: '민호',
  brideLastName: 'Lee',
  brideFirstName: 'Yuna',
  brideLastNameKr: '이',
  brideFirstNameKr: '유나',
  mainPhrase: '서로 다른 두 사람이\n사랑으로 하나가 되는 날',
  weddingDate: '2026-06-20',
  weddingTime: '14:00',
  ceremonyHall: 'The Shilla Seoul',
  venue: 'Diamond Ballroom',
  address: '서울특별시 중구 동호로 249',
  transportGuide: '지하철 3호선 동대입구역 5번 출구에서 도보 5분',
  groomContact: '010-1234-5678',
  brideContact: '010-8765-4321',
  groomFatherName: '김철수',
  groomMotherName: '박영희',
  brideFatherName: '이정호',
  brideMotherName: '최미선',
  groomParentContact: '010-1111-2222',
  brideParentContact: '010-3333-4444',
  groomBankAccount: '123-456-789012',
  brideBankAccount: '987-654-321098',
  groomBankName: '신한은행',
  brideBankName: '국민은행',
  latitude: 37.5548,
  longitude: 127.0017,
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

export const musicTracks = [
  { id: 'romantic-piano', name: 'Romantic Piano', nameKr: '로맨틱 피아노', url: '/assets/music/romantic-piano.mp3' },
  { id: 'string-quartet', name: 'String Quartet', nameKr: '현악 4중주', url: '/assets/music/string-quartet.mp3' },
  { id: 'acoustic-guitar', name: 'Acoustic Guitar', nameKr: '어쿠스틱 기타', url: '/assets/music/acoustic-guitar.mp3' },
  { id: 'classical-waltz', name: 'Classical Waltz', nameKr: '클래식 왈츠', url: '/assets/music/classical-waltz.mp3' },
  { id: 'korean-traditional', name: 'Korean Traditional', nameKr: '한국 전통음악', url: '/assets/music/korean-traditional.mp3' },
]
