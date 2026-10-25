import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { getClientIp } from './request-ip'

function requestWithHeader(value: string | null) {
  return new NextRequest('http://localhost/api/test', {
    headers: value ? { 'x-forwarded-for': value } : undefined,
  })
}

describe('getClientIp', () => {
  it('returns the first address when there are multiple proxies', () => {
    expect(getClientIp(requestWithHeader('1.2.3.4, 5.6.7.8'))).toBe('1.2.3.4')
  })

  it('trims surrounding whitespace', () => {
    expect(getClientIp(requestWithHeader(' 1.2.3.4 , 5.6.7.8'))).toBe('1.2.3.4')
  })

  it('falls back to "unknown" when the header is missing', () => {
    expect(getClientIp(requestWithHeader(null))).toBe('unknown')
  })
})
