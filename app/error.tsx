'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Heart, RotateCw, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app-error]', error)
  }, [error])

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

        <Heart className="h-10 w-10 text-accent mb-6" fill="currentColor" />

        <h1 className="font-serif text-2xl font-semibold mb-2">문제가 발생했어요</h1>
        <p className="text-sm text-muted-foreground mb-10 max-w-sm">
          일시적인 오류일 수 있어요.
          <br />
          다시 시도하거나 홈으로 돌아가 보세요.
        </p>

        <div className="flex items-center gap-3">
          <Button size="lg" onClick={() => reset()}>
            <RotateCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              홈으로
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
