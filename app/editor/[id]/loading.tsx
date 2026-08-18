import { Heart } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Heart className="h-8 w-8 text-accent animate-pulse" fill="currentColor" />
      <p className="text-sm text-muted-foreground">에디터를 불러오는 중...</p>
    </div>
  )
}
