'use client'

import { useEffect } from 'react'
import { Link, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { type ShareSettings, type WeddingInfo } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { loadKakaoSdk } from '@/lib/kakao-sdk'

interface ShareSectionProps {
  shareSettings: ShareSettings
  weddingInfo: WeddingInfo
  isDark?: boolean
  invitationUrl?: string
  lovely?: boolean
}

export function ShareSection({ shareSettings, weddingInfo, isDark, invitationUrl, lovely }: ShareSectionProps) {
  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ?? ''
  const url = invitationUrl ?? (typeof window !== 'undefined' ? window.location.href : '')

  useEffect(() => {
    if (apiKey) loadKakaoSdk(apiKey).catch(() => {})
  }, [apiKey])

  const handleKakaoShare = () => {
    if (!window.Kakao?.isInitialized()) {
      toast.error('카카오톡 공유를 아직 불러오지 못했어요')
      return
    }

    const groomName = `${weddingInfo.groomLastNameKr}${weddingInfo.groomFirstNameKr}`
    const brideName = `${weddingInfo.brideLastNameKr}${weddingInfo.brideFirstNameKr}`
    const defaultDesc = `${groomName} · ${brideName}의 결혼식에 초대합니다`

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: shareSettings.kakaoTitle || `${groomName} & ${brideName} 웨딩`,
        description: shareSettings.kakaoDesc || defaultDesc,
        imageUrl: shareSettings.kakaoImg || undefined,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        { title: '모바일 청첩장 보기', link: { mobileWebUrl: url, webUrl: url } },
      ],
    })
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      alert('링크가 복사되었습니다!')
    } catch {
      const el = document.createElement('textarea')
      el.value = url
      el.style.position = 'fixed'
      document.body.appendChild(el)
      el.focus()
      el.select()
      try { document.execCommand('copy'); alert('링크가 복사되었습니다!') }
      catch { alert('복사에 실패했습니다.') }
      document.body.removeChild(el)
    }
  }

  if (lovely) {
    return (
      <div className="flex items-center gap-2 bg-white rounded-full p-1.5 shadow-[0_16px_34px_rgba(91,74,78,0.18)]">
        <button
          onClick={handleKakaoShare}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold py-3 rounded-full"
          style={{ background: '#FEE500', color: '#3C1E1E' }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          카카오톡 공유
        </button>
        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold py-3 rounded-full"
          style={{ border: '1px solid #F0D7DD', color: '#B65C6C' }}
        >
          <Link className="h-3.5 w-3.5" />
          링크 복사
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className={`flex-1 ${isDark ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
        onClick={handleCopyLink}
      >
        <Link className="h-3 w-3 mr-1" />
        링크 복사
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={`flex-1 ${isDark ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
        onClick={handleKakaoShare}
      >
        <MessageCircle className="h-3 w-3 mr-1" />
        카카오톡
      </Button>
    </div>
  )
}
