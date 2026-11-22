'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { type WeddingInfo } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { getSiteUrl } from '@/lib/site-url'
import { buildInviteMessage, inviteMessageStyleLabels, type InviteMessageStyle } from '@/lib/invite-message'

interface InviteMessageComposerProps {
  weddingInfo: WeddingInfo
  slug: string
  invitationId: string
}

// 신랑신부가 하객에게 개인적으로 보낼 카톡/문자용 초대 문구를 만들어준다. 카카오톡
// 공유 카드(share-section.tsx)와는 별개 — 저쪽은 링크를 카드로 보내는 거고, 여긴
// 복사해서 직접 붙여넣을 "말"을 만드는 용도라 같은 화면에 두지 않았다.
export function InviteMessageComposer({ weddingInfo, slug, invitationId }: InviteMessageComposerProps) {
  const url = `${getSiteUrl()}/invitation/${slug || invitationId}`
  const [style, setStyle] = useState<InviteMessageStyle>('casual')
  const [text, setText] = useState(() => buildInviteMessage('casual', weddingInfo, url))

  const handleStyleSelect = (next: InviteMessageStyle) => {
    setStyle(next)
    setText(buildInviteMessage(next, weddingInfo, url))
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('문구가 복사되었습니다')
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        하객에게 카톡이나 문자로 직접 보낼 때 쓸 수 있는 문구예요. 스타일을 고른 뒤 자유롭게 고쳐보세요.
      </p>
      <div className="flex gap-1.5">
        {(Object.keys(inviteMessageStyleLabels) as InviteMessageStyle[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleStyleSelect(key)}
            className={cn(
              'flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
              style === key ? 'border-accent bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {inviteMessageStyleLabels[key]}
          </button>
        ))}
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className="text-sm" />
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleCopy}>
        <Copy className="h-3.5 w-3.5 mr-1.5" />
        문구 복사하기
      </Button>
    </div>
  )
}
