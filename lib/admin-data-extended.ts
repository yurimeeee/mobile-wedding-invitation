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

const usageTypes: UsageType[] = ["무료", "베이직", "프리미엄"]
const statuses: InvitationStatus[] = ["공개", "비공개", "만료"]
const bgColors = ["#f5ede4", "#faf3f3", "#ffffff", "#f3ede0", "#1a1a1a", "#fdf0f0", "#fdfbf7", "#f7f1e8"]
const templates = [
  "파스텔 가든 N01",
  "클래식 로즈 C02",
  "미니멀 화이트 M03",
  "전통 한지 T01",
  "모던 블랙 B04",
  "심플 아이보리 M06",
]

const groomNames = ["김민수", "박준호", "정우진", "강동현", "임재민", "오세훈", "윤성호", "장현우", "신동엽", "한지훈", "조민재", "권태양"]
const brideNames = ["이지영", "최서연", "한소희", "윤채원", "송하윤", "배수지", "김나연", "이수민", "박예린", "정다은", "최유진", "홍서아"]
const creatorNames = ["김민수", "최서연", "정우진", "윤채원", "임재민", "배수지", "장현우", "정다은", "권태양", "홍서아"]

function makeInvitation(i: number): ManagedInvitation {
  const groom = groomNames[i % groomNames.length]
  const bride = brideNames[i % brideNames.length]
  const creator = creatorNames[i % creatorNames.length]
  const usageType = usageTypes[i % usageTypes.length]
  const status = statuses[i % statuses.length]
  const day = ((i * 3) % 27) + 1
  const month = ((i * 2) % 12) + 1
  const expMonth = ((month + 2 - 1) % 12) + 1
  return {
    id: `INV-${20500 - i}`,
    slug: '',
    coupleNames: `${groom} & ${bride}`,
    groomName: groom,
    brideName: bride,
    creatorName: creator,
    creatorEmail: `${["minsoo", "seoyeon", "woojin", "chaewon", "jaemin", "suji", "hyunwoo", "daeun", "taeyang", "seoa"][i % 10]}@example.com`,
    usageType,
    status,
    createdDate: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    expiryDate: `2026-${String(expMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    views: Math.floor(500 + ((i * 733) % 4200)),
    rsvps: Math.floor(20 + ((i * 37) % 260)),
    bgColor: bgColors[i % bgColors.length],
    template: templates[i % templates.length],
  }
}

export const managedInvitations: ManagedInvitation[] = Array.from({ length: 24 }, (_, i) => makeInvitation(i))

function makeUser(i: number): ManagedUser {
  const name = creatorNames[i % creatorNames.length]
  const totalCreated = ((i * 2) % 6) + 1
  const currentlyPublic = Math.min(totalCreated, ((i * 3) % 4))
  const joinMonth = ((i) % 12) + 1
  const joinDay = ((i * 5) % 27) + 1
  const activityLabels = ["2시간 전", "5시간 전", "어제", "3일 전", "1주 전", "2026-07-10", "2026-06-28"]
  const notes = [
    "",
    "VIP 고객 / 환불 이력 있음",
    "프리미엄 업그레이드 문의",
    "결제 오류 1회 처리 완료",
    "",
    "청첩장 도메인 변경 요청",
  ]
  const note = notes[i % notes.length]
  return {
    id: `USR-${1000 + i}`,
    name,
    email: `${["minsoo", "seoyeon", "woojin", "chaewon", "jaemin", "suji", "hyunwoo", "daeun", "taeyang", "seoa"][i % 10]}@example.com`,
    joinDate: `2026-${String(joinMonth).padStart(2, "0")}-${String(joinDay).padStart(2, "0")}`,
    totalCreated,
    currentlyPublic,
    lastActivity: `2026-07-${String(((i * 3) % 20) + 1).padStart(2, "0")}`,
    lastActivityLabel: activityLabels[i % activityLabels.length],
    status: i % 7 === 5 ? "차단" : "활성",
    adminNote: note,
    noteHistory: note
      ? [
          { date: "2026-07-05", admin: "관리자A", note: "최초 메모 등록" },
          { date: "2026-07-12", admin: "관리자B", note: note },
        ]
      : [],
  }
}

export const managedUsers: ManagedUser[] = Array.from({ length: 14 }, (_, i) => makeUser(i))

// ---- Analytics ----
export const analyticsKpis = {
  totalCreated: 1248,
  totalCreatedGrowth: 12,
  mostActiveMonth: "10월",
  mostActiveMonthCount: 205,
  avgPublicDuration: 47,
  avgPublicDurationGrowth: 4,
  conversionRate: 6.8,
  conversionGrowth: 1.2,
}

export const creationTimeline = [
  { month: "1월", count: 62 },
  { month: "2월", count: 78 },
  { month: "3월", count: 95 },
  { month: "4월", count: 128 },
  { month: "5월", count: 156 },
  { month: "6월", count: 142 },
  { month: "7월", count: 98 },
  { month: "8월", count: 110 },
  { month: "9월", count: 178 },
  { month: "10월", count: 205 },
  { month: "11월", count: 168 },
  { month: "12월", count: 132 },
]

export const creationByDay = [
  { day: "월", count: 142 },
  { day: "화", count: 128 },
  { day: "수", count: 156 },
  { day: "목", count: 168 },
  { day: "금", count: 205 },
  { day: "토", count: 312 },
  { day: "일", count: 268 },
]

export const topTemplates = [
  { name: "파스텔 가든 N01", usage: 340 },
  { name: "클래식 로즈 C02", usage: 285 },
  { name: "미니멀 화이트 M03", usage: 232 },
  { name: "전통 한지 T01", usage: 198 },
  { name: "모던 블랙 B04", usage: 154 },
]

export const categoryBreakdown = [
  { category: "플로럴", value: 420, fill: "var(--chart-1)" },
  { category: "클래식", value: 310, fill: "var(--chart-2)" },
  { category: "미니멀", value: 268, fill: "var(--chart-3)" },
  { category: "모던", value: 180, fill: "var(--chart-4)" },
  { category: "전통", value: 70, fill: "var(--chart-5)" },
]

export const usageTypeBreakdown = [
  { type: "무료", value: 720, fill: "var(--chart-3)" },
  { type: "베이직", value: 342, fill: "var(--chart-2)" },
  { type: "프리미엄", value: 186, fill: "var(--chart-1)" },
]

export const topInvitations = managedInvitations
  .slice()
  .sort((a, b) => b.views - a.views)
  .slice(0, 5)

export const usageTypeOptions = ["전체", "무료", "베이직", "프리미엄"] as const
export const statusOptions = ["전체", "공개", "비공개", "만료"] as const
export const accountStatusOptions = ["전체", "활성", "차단"] as const
