'use client'

import Link from 'next/link'
import { Heart, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center"
      >
        <Link href="/" className="mb-10">
          <Logo width={140} height={24} />
        </Link>

        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6"
        >
          <Heart className="h-10 w-10 text-accent" fill="currentColor" />
        </motion.div>

        <h1 className="font-serif text-6xl font-semibold tracking-tight mb-3">404</h1>
        <p className="text-lg font-medium mb-2">페이지를 찾을 수 없습니다</p>
        <p className="text-sm text-muted-foreground mb-10 max-w-sm">
          주소가 잘못되었거나 삭제된 페이지예요.
          <br />
          다시 홈으로 돌아가 보세요.
        </p>

        <div className="flex items-center gap-3">
          <Button asChild size="lg">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              홈으로 돌아가기
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">내 청첩장 보기</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
