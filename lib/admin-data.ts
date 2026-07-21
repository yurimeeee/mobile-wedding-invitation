export interface AdminTemplate {
  id: string
  name: string
  category: "모던" | "클래식" | "플로럴" | "미니멀" | "전통"
  status: "활성" | "임시저장"
  usageCount: number
  thumbnail: string
  bgColor: string
  fontFamily: string
  layout: "카드형" | "스크롤형"
}

export interface AdminInvitation {
  id: string
  coupleNames: string
  template: string
  createdDate: string
  status: "활성" | "만료"
  views: number
}

export const dashboardStats = {
  totalInvitations: 1248,
  invitationsGrowth: 12,
  activeTemplates: 18,
  templatesGrowth: 3,
  totalViews: 84920,
  viewsGrowth: 24,
  conversionRate: 6.8,
  conversionGrowth: 1.2,
}

export const monthlyInvitations = [
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

export const templatePopularity = [
  { name: "파스텔 가든 N01", usage: 340, percentage: 100 },
  { name: "클래식 로즈 C02", usage: 285, percentage: 84 },
  { name: "미니멀 화이트 M03", usage: 232, percentage: 68 },
  { name: "전통 한지 T01", usage: 198, percentage: 58 },
  { name: "모던 블랙 B04", usage: 154, percentage: 45 },
]

export const adminTemplates: AdminTemplate[] = [
  {
    id: "tpl-1",
    name: "파스텔 가든 N01",
    category: "플로럴",
    status: "활성",
    usageCount: 340,
    thumbnail: "",
    bgColor: "#f5ede4",
    fontFamily: "Noto Serif KR",
    layout: "스크롤형",
  },
  {
    id: "tpl-2",
    name: "클래식 로즈 C02",
    category: "클래식",
    status: "활성",
    usageCount: 285,
    thumbnail: "",
    bgColor: "#faf3f3",
    fontFamily: "Noto Serif KR",
    layout: "카드형",
  },
  {
    id: "tpl-3",
    name: "미니멀 화이트 M03",
    category: "미니멀",
    status: "활성",
    usageCount: 232,
    thumbnail: "",
    bgColor: "#ffffff",
    fontFamily: "Geist",
    layout: "카드형",
  },
  {
    id: "tpl-4",
    name: "전통 한지 T01",
    category: "전통",
    status: "활성",
    usageCount: 198,
    thumbnail: "",
    bgColor: "#f3ede0",
    fontFamily: "Noto Serif KR",
    layout: "스크롤형",
  },
  {
    id: "tpl-5",
    name: "모던 블랙 B04",
    category: "모던",
    status: "활성",
    usageCount: 154,
    thumbnail: "",
    bgColor: "#1a1a1a",
    fontFamily: "Geist",
    layout: "카드형",
  },
  {
    id: "tpl-6",
    name: "로맨틱 블러쉬 R05",
    category: "플로럴",
    status: "임시저장",
    usageCount: 0,
    thumbnail: "",
    bgColor: "#fdf0f0",
    fontFamily: "Noto Serif KR",
    layout: "스크롤형",
  },
  {
    id: "tpl-7",
    name: "심플 아이보리 M06",
    category: "미니멀",
    status: "활성",
    usageCount: 121,
    thumbnail: "",
    bgColor: "#fdfbf7",
    fontFamily: "Geist",
    layout: "카드형",
  },
  {
    id: "tpl-8",
    name: "빈티지 골드 C07",
    category: "클래식",
    status: "임시저장",
    usageCount: 0,
    thumbnail: "",
    bgColor: "#f7f1e8",
    fontFamily: "Noto Serif KR",
    layout: "스크롤형",
  },
]

export const recentInvitations: AdminInvitation[] = [
  {
    id: "INV-20481",
    coupleNames: "김민수 & 이지영",
    template: "파스텔 가든 N01",
    createdDate: "2026-07-18",
    status: "활성",
    views: 1240,
  },
  {
    id: "INV-20480",
    coupleNames: "박준호 & 최서연",
    template: "클래식 로즈 C02",
    createdDate: "2026-07-17",
    status: "활성",
    views: 890,
  },
  {
    id: "INV-20479",
    coupleNames: "정우진 & 한소희",
    template: "미니멀 화이트 M03",
    createdDate: "2026-07-15",
    status: "활성",
    views: 2100,
  },
  {
    id: "INV-20478",
    coupleNames: "강동현 & 윤채원",
    template: "전통 한지 T01",
    createdDate: "2026-07-12",
    status: "만료",
    views: 3400,
  },
  {
    id: "INV-20477",
    coupleNames: "임재민 & 송하윤",
    template: "모던 블랙 B04",
    createdDate: "2026-07-10",
    status: "활성",
    views: 760,
  },
  {
    id: "INV-20476",
    coupleNames: "오세훈 & 배수지",
    template: "심플 아이보리 M06",
    createdDate: "2026-07-08",
    status: "만료",
    views: 1980,
  },
]

export const templateCategories = ["전체", "모던", "클래식", "플로럴", "미니멀", "전통"] as const
