import { ImageResponse } from 'next/og'
import { resolvePublishedInvitation } from '@/lib/invitation-server'
import { formatWeddingDateLabel } from '@/components/invitation/shared/date-format'

export const size = { width: 1200, height: 630 }

// Satori(ImageResponse 내부 렌더러)는 기본 폰트에 한글 글리프가 없어 빈 사각형으로 깨진다.
// Google Fonts CSS2 API에 &text=를 넘기면 그 문자만 담은 서브셋을 truetype으로 내려주는데,
// 이걸 그대로 fonts 옵션에 전달해야 카드에 한글이 제대로 그려진다.
async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text()
    const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
    if (!match) return null
    const fontRes = await fetch(match[1])
    if (!fontRes.ok) return null
    return await fontRes.arrayBuffer()
  } catch {
    return null
  }
}

// shareSettings.linkImg를 직접 올리지 않은 신랑신부를 위한 기본 공유 카드.
// 커버 사진이 있으면 배경으로 쓰고, 없으면 그라디언트 배경에 이름/날짜만 올린다.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await resolvePublishedInvitation(id)
  if (result.kind !== 'ok') {
    return new Response('Not found', { status: 404 })
  }

  const { state } = result
  const groomName = `${state.weddingInfo.groomLastNameKr}${state.weddingInfo.groomFirstNameKr}`
  const brideName = `${state.weddingInfo.brideLastNameKr}${state.weddingInfo.brideFirstNameKr}`
  const titleText = `${groomName} ♥ ${brideName}`
  const dateLabel = formatWeddingDateLabel(state.weddingInfo.weddingDate)
  const inviteText = '결혼식에 초대합니다'
  const coverPhoto = state.gallery.find((img) => img.type !== 'video')?.url

  const fontSubset = `${titleText}${dateLabel}${inviteText}`
  const [bold, regular] = await Promise.all([
    loadGoogleFont('Noto+Sans+KR', 700, fontSubset),
    loadGoogleFont('Noto+Sans+KR', 400, fontSubset),
  ])
  const fonts = [
    bold && { name: 'Noto Sans KR', data: bold, weight: 700 as const, style: 'normal' as const },
    regular && { name: 'Noto Sans KR', data: regular, weight: 400 as const, style: 'normal' as const },
  ].filter((f): f is NonNullable<typeof f> => f !== null)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: coverPhoto ? '#000' : 'linear-gradient(135deg, #F5E3E4, #DDB0B5)',
        }}
      >
        {coverPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPhoto}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: coverPhoto ? 'linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.72) 100%)' : undefined,
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            width: '100%',
            height: '100%',
            padding: '64px 72px',
            color: coverPhoto ? '#FFFFFF' : '#4A3F3F',
          }}
        >
          <div style={{ fontSize: 58, fontFamily: 'Noto Sans KR', fontWeight: 700 }}>{titleText}</div>
          {dateLabel && (
            <div style={{ fontSize: 30, marginTop: 18, fontFamily: 'Noto Sans KR', fontWeight: 400, opacity: 0.9 }}>
              {dateLabel}
            </div>
          )}
          <div style={{ fontSize: 24, marginTop: 10, fontFamily: 'Noto Sans KR', fontWeight: 400, opacity: 0.8 }}>
            {inviteText}
          </div>
        </div>
      </div>
    ),
    { width: size.width, height: size.height, fonts: fonts.length > 0 ? fonts : undefined }
  )
}
