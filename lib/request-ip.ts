import type { NextRequest } from 'next/server'

// x-forwarded-for의 첫 값을 그대로 신뢰한다 — Vercel은 이 헤더를 자체적으로 설정하고
// 클라이언트가 보낸 값을 덮어쓰므로 Vercel 배포에서는 조작할 수 없다. 다른 호스팅으로
// 옮기거나 커스텀 프록시를 앞에 두는 경우 이 전제가 깨질 수 있으니, 바꿀 때 이 함수를 같이 봐야 한다.
export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
