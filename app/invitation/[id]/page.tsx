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
  const image = state.shareSettings.linkImg || state.gallery[0]?.url
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
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
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
