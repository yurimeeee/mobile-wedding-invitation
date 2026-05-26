'use client'

import { useEffect } from 'react'
import { Link, MessageCircle } from 'lucide-react'
import { type ShareSettings, type WeddingInfo } from '@/lib/types'
import { Button } from '@/components/ui/button'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Kakao: any
  }
}

let kakaoShareInitialized = false

function loadKakaoShareSdk(apiKey: string) {
  if (kakaoShareInitialized) return
  const existing = document.querySelector('script[src*="developers.kakao.com/sdk"]')
  if (existing) return

  const script = document.createElement('script')
  script.src = 'https://developers.kakao.com/sdk/js/kakao.js'
  script.async = true
  script.onload = () => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(apiKey)
      kakaoShareInitialized = true
    }
  }
  document.head.appendChild(script)
}

interface ShareSectionProps {
  shareSettings: ShareSettings
  weddingInfo: WeddingInfo
  isDark?: boolean
  invitationUrl?: string
}

export function ShareSection({ shareSettings, weddingInfo, isDark, invitationUrl }: ShareSectionProps) {
  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ?? ''
  const url = invitationUrl ?? (typeof window !== 'undefined' ? window.location.href : '')

  useEffect(() => {
    if (apiKey) loadKakaoShareSdk(apiKey)
  }, [apiKey])

  const handleKakaoShare = () => {
    if (!window.Kakao?.isInitialized()) {
      alert('카카오 SDK가 아직 로드되지 않았습니다.')
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
