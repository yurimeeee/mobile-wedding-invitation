import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export function Logo({ className, width = 120, height = 20 }: LogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="mywed.invy"
      width={width}
      height={height}
      className={cn("h-auto", className)}
      priority
    />
  )
}
