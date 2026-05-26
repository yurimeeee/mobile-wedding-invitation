import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Serif_KR } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
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

export const metadata: Metadata = {
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
    <html lang="ko" className={`${geist.variable} ${geistMono.variable} ${notoSerifKR.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
