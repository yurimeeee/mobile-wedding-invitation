import { NextResponse, type NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

interface KakaoUser {
  id: number
  properties?: { nickname?: string; profile_image?: string }
  kakao_account?: { profile?: { nickname?: string; profile_image_url?: string } }
}

// 카카오는 Firebase Auth의 기본 제공 제공자가 아니므로, 클라이언트가 카카오 SDK로 받은
// access_token을 여기서 카카오 서버에 직접 검증하고, 검증된 사용자에 대해서만
// Firebase 커스텀 토큰을 발급한다. uid는 카카오 회원번호에 고정 매핑해 재로그인 시 같은 계정으로 이어지게 한다.
export async function POST(request: NextRequest) {
  const { accessToken } = await request.json().catch(() => ({}))
  if (!accessToken || typeof accessToken !== 'string') {
    return NextResponse.json({ error: 'accessToken이 필요합니다.' }, { status: 400 })
  }

  const kakaoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!kakaoRes.ok) {
    return NextResponse.json({ error: '카카오 인증에 실패했습니다.' }, { status: 401 })
  }

  const kakaoUser = (await kakaoRes.json()) as KakaoUser
  const uid = `kakao:${kakaoUser.id}`
  const displayName =
    kakaoUser.properties?.nickname ?? kakaoUser.kakao_account?.profile?.nickname ?? '카카오 사용자'
  const photoURL =
    kakaoUser.properties?.profile_image ?? kakaoUser.kakao_account?.profile?.profile_image_url

  try {
    await adminAuth.updateUser(uid, { displayName, ...(photoURL && { photoURL }) })
  } catch {
    await adminAuth.createUser({ uid, displayName, ...(photoURL && { photoURL }) })
  }

  const token = await adminAuth.createCustomToken(uid, { provider: 'kakao' })
  return NextResponse.json({ token })
}
