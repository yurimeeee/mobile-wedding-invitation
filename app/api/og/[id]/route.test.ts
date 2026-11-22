import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

const { resolvePublishedInvitation } = vi.hoisted(() => ({
  resolvePublishedInvitation: vi.fn(),
}))

vi.mock('@/lib/invitation-server', () => ({ resolvePublishedInvitation }))

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    weddingInfo: {
      groomLastNameKr: '김', groomFirstNameKr: '철수',
      brideLastNameKr: '이', brideFirstNameKr: '영희',
      weddingDate: '2026-05-16',
    },
    gallery: [],
    ...overrides,
  }
}

function getRequest(id: string) {
  return GET(new Request(`http://localhost/api/og/${id}`), { params: Promise.resolve({ id }) })
}

beforeEach(() => {
  resolvePublishedInvitation.mockReset()
  // Google Fonts 요청이 테스트에서 실제 네트워크를 타지 않도록 즉시 실패시킨다 —
  // loadGoogleFont는 이를 try/catch로 삼켜 null을 반환하므로 폰트 없이도 렌더는 계속된다.
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no network in tests')))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GET /api/og/[id]', () => {
  it('returns 404 when the invitation is not found or unpublished', async () => {
    resolvePublishedInvitation.mockResolvedValue({ kind: 'not-found' })
    const res = await getRequest('missing')
    expect(res.status).toBe(404)
  })

  it('returns 404 for an expired invitation', async () => {
    resolvePublishedInvitation.mockResolvedValue({ kind: 'expired' })
    const res = await getRequest('inv-1')
    expect(res.status).toBe(404)
  })

  it('renders a PNG card with a gradient background when there is no cover photo', async () => {
    resolvePublishedInvitation.mockResolvedValue({ kind: 'ok', id: 'inv-1', state: makeState() })
    const res = await getRequest('inv-1')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
  })

  it('renders a PNG card using the cover photo as the background when the gallery has one', async () => {
    resolvePublishedInvitation.mockResolvedValue({
      kind: 'ok',
      id: 'inv-1',
      state: makeState({ gallery: [{ url: 'https://example.com/cover.jpg' }] }),
    })
    const res = await getRequest('inv-1')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
  })

  it('still renders when weddingDate is missing', async () => {
    resolvePublishedInvitation.mockResolvedValue({
      kind: 'ok',
      id: 'inv-1',
      state: makeState({ weddingInfo: { groomLastNameKr: '김', groomFirstNameKr: '철수', brideLastNameKr: '이', brideFirstNameKr: '영희', weddingDate: '' } }),
    })
    const res = await getRequest('inv-1')
    expect(res.status).toBe(200)
  })
})
