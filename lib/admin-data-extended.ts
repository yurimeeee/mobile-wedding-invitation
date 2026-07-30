export type UsageType = "무료" | "베이직" | "프리미엄"
export type InvitationStatus = "공개" | "비공개" | "만료"
export type AccountStatus = "활성" | "차단"

export interface ManagedInvitation {
  id: string
  slug: string
  coupleNames: string
  groomName: string
  brideName: string
  creatorName: string
  creatorEmail: string
  usageType: UsageType
  status: InvitationStatus
  createdDate: string
  expiryDate: string
  views: number
  rsvps: number
  bgColor: string
  template: string
}

export interface NoteHistory {
  date: string
  admin: string
  note: string
}

export interface ManagedUser {
  id: string
  name: string
  email: string
  joinDate: string
  totalCreated: number
  currentlyPublic: number
  lastActivity: string
  lastActivityLabel: string
  status: AccountStatus
  adminNote: string
  noteHistory: NoteHistory[]
}

export const usageTypeOptions = ["전체", "무료", "베이직", "프리미엄"] as const
export const statusOptions = ["전체", "공개", "비공개", "만료"] as const
export const accountStatusOptions = ["전체", "활성", "차단"] as const
