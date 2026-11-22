import { describe, expect, it } from 'vitest'
import { buildInviteMessage } from './invite-message'
import { defaultWeddingInfo } from './types'

function makeInfo(overrides: Partial<typeof defaultWeddingInfo> = {}) {
  return {
    ...defaultWeddingInfo,
    groomLastNameKr: '김', groomFirstNameKr: '철수',
    brideLastNameKr: '이', brideFirstNameKr: '영희',
    weddingDate: '2026-05-16',
    weddingTime: '오후 2시',
    ceremonyHall: '그레이스홀 3층',
    venue: '서울웨딩컨벤션',
    ...overrides,
  }
}

const url = 'https://example.com/invitation/abc'

describe('buildInviteMessage', () => {
  it('includes both names, the date/time/venue, and the link for every style', () => {
    const info = makeInfo()
    for (const style of ['formal', 'casual', 'simple'] as const) {
      const message = buildInviteMessage(style, info, url)
      expect(message).toContain('김철수')
      expect(message).toContain('이영희')
      expect(message).toContain('2026')
      expect(message).toContain('그레이스홀 3층')
      expect(message.endsWith(url)).toBe(true)
    }
  })

  it('omits the date/venue line entirely when both are missing, instead of leaving a blank line', () => {
    const info = makeInfo({ weddingDate: '', weddingTime: '', ceremonyHall: '', venue: '' })
    const message = buildInviteMessage('simple', info, url)
    expect(message.split('\n')).toHaveLength(2)
  })

  it('produces a different tone of text per style', () => {
    const info = makeInfo()
    const formal = buildInviteMessage('formal', info, url)
    const casual = buildInviteMessage('casual', info, url)
    const simple = buildInviteMessage('simple', info, url)
    expect(formal).not.toBe(casual)
    expect(casual).not.toBe(simple)
    expect(formal).toContain('귀한 걸음')
    expect(casual).toContain('♥')
  })
})
