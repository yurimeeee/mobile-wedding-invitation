import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { adminDb } from '@/lib/firebase-admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-ip'

const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX = 20

// Firestore 보안 규칙은 status/uid로만 쿼리를 정적으로 검증할 수 있어
// slug 조건만 있는 쿼리는 클라이언트 SDK로 실행할 수 없다. Admin SDK로 우회한다.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')?.trim() ?? ''
  const excludeId = searchParams.get('excludeId') ?? ''

  if (!slug) return NextResponse.json({ error: 'slug가 필요합니다.' }, { status: 400 })

  // 인증 없는 공개 엔드포인트라 슬러그 전체를 훑는 열거(enumeration)에 노출될 수 있다.
  // 입력창의 디바운스(600ms)를 감안해 정상 사용은 막지 않을 정도로 넉넉하게 제한한다.
  const ipHash = createHash('sha256').update(getClientIp(request)).digest('hex')
  const allowed = await checkRateLimit(adminDb.collection('rateLimits').doc(`slug:${ipHash}`), RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)
  if (!allowed) {
    return NextResponse.json({ error: '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const snap = await adminDb.collection('invitations').where('slug', '==', slug).limit(1).get()
  const available = snap.empty || snap.docs[0].id === excludeId

  return NextResponse.json({ available })
}
