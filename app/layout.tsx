import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Serif_KR, Dancing_Script, Gowun_Batang, Jua } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/auth-provider'
import { getSiteUrl } from '@/lib/site-url'
import './globals.css'

const geist = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist'
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono'
})

const notoSerifKR = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: '--font-noto-serif-kr'
})

// '러블리 블러쉬' 템플릿 커버에서 신랑신부 영문 이름을 우아한 스크립트체로 보여주기 위한 폰트
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: '--font-dancing-script'
})

// 자유 요소 캔버스의 텍스트 폰트 선택지 확장용 — 둘 다 한글을 지원하면서도
// Noto Serif KR과는 분위기가 다른(차분한 손글씨풍 / 둥글고 발랄한) 선택지로 골랐다.
const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: '--font-gowun-batang'
})

const jua = Jua({
  subsets: ["latin"],
  weight: ["400"],
  variable: '--font-jua'
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'WedInvite - 아름다운 모바일 청첩장',
  description: '몇 분 만에 아름다운 모바일 청첩장을 만드세요. 특별한 날을 위한 세련되고 우아한 디자인.',
  keywords: ['wedding invitation', 'korean wedding', 'mobile invitation', '청첩장', '모바일 청첩장'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${geist.variable} ${geistMono.variable} ${notoSerifKR.variable} ${dancingScript.variable} ${gowunBatang.variable} ${jua.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        <AuthProvider>
          {children}
          <Toaster />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  )
}
