import { type WeddingInfo } from './types'
import { formatWeddingDateLabel } from '@/components/invitation/shared/date-format'

export type InviteMessageStyle = 'formal' | 'casual' | 'simple'

export const inviteMessageStyleLabels: Record<InviteMessageStyle, string> = {
  formal: '격식있게',
  casual: '다정하게',
  simple: '간단하게',
}

// 신랑신부가 하객에게 개인적으로 보낼 카톡/문자용 초대 문구를 만든다.
export function buildInviteMessage(style: InviteMessageStyle, info: WeddingInfo, url: string): string {
  const groomName = `${info.groomLastNameKr}${info.groomFirstNameKr}`
  const brideName = `${info.brideLastNameKr}${info.brideFirstNameKr}`
  const dateLine = [formatWeddingDateLabel(info.weddingDate), info.weddingTime].filter(Boolean).join(' ')
  const venueLine = [info.ceremonyHall, info.venue].filter(Boolean).join(' ')
  const infoLines = [dateLine, venueLine].filter(Boolean)

  const bodies: Record<InviteMessageStyle, string[]> = {
    formal: [
      `${groomName} · ${brideName} 두 사람이 사랑으로 하나가 됩니다.`,
      ...infoLines,
      '귀한 걸음 하시어 축복해 주시면 더없는 기쁨이겠습니다.',
    ],
    casual: [
      `${groomName} ♥ ${brideName} 결혼합니다!`,
      ...infoLines,
      '오셔서 함께 축하해주시면 정말 행복할 것 같아요 :)',
    ],
    simple: [
      `${groomName} ♥ ${brideName} 결혼식에 초대합니다.`,
      ...(infoLines.length > 0 ? [infoLines.join(' · ')] : []),
    ],
  }

  return [...bodies[style], url].join('\n')
}
