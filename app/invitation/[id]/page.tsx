import type { Metadata } from 'next'
import { Heart, CalendarOff } from 'lucide-react'
import { resolvePublishedInvitation } from '@/lib/invitation-server'
import { getSiteUrl } from '@/lib/site-url'
import { InvitationViewClient } from './invitation-view-client'

interface InvitationPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: InvitationPageProps): Promise<Metadata> {
  const { id } = await params
  const result = await resolvePublishedInvitation(id)
  if (result.kind !== 'ok') {
    return { title: '청첩장을 찾을 수 없습니다' }
  }

  const { state } = result
  const groomName = `${state.weddingInfo.groomLastNameKr}${state.weddingInfo.groomFirstNameKr}`
  const brideName = `${state.weddingInfo.brideLastNameKr}${state.weddingInfo.brideFirstNameKr}`
  const title = state.shareSettings.linkTitle || `${groomName} ♥ ${brideName} 결혼식에 초대합니다`
  const description = state.shareSettings.linkDesc || state.weddingInfo.mainPhrase || '모바일 청첩장'
  // 공유 이미지를 직접 업로드하지 않았으면 신랑신부 이름/예식일이 들어간 카드를 자동 생성해 보여준다.
  const image = state.shareSettings.linkImg || `${getSiteUrl()}/api/og/${state.slug || result.id}`
  const url = `${getSiteUrl()}/invitation/${state.slug || result.id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function InvitationViewPage({ params }: InvitationPageProps) {
  const { id } = await params
  const result = await resolvePublishedInvitation(id)

  if (result.kind === 'expired') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground px-6 text-center">
        <CalendarOff className="h-12 w-12 opacity-20" />
        <p className="text-sm">만료된 청첩장이에요</p>
      </div>
    )
  }

  if (result.kind === 'not-found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Heart className="h-12 w-12 opacity-20" />
        <p className="text-sm">청첩장을 찾을 수 없습니다</p>
      </div>
    )
  }

  return <InvitationViewClient state={result.state} invitationId={result.id} />
}
