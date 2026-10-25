import type { DocumentReference } from 'firebase-admin/firestore'
import { adminDb } from './firebase-admin'

// 고정 윈도우(windowStart + count) 방식은 윈도우 경계에서 직전 윈도우 끝과 다음 윈도우
// 시작이 맞붙어 설계한 한도의 최대 2배까지 통과시킬 수 있다. 그래서 각 시도의 타임스탬프를
// 배열로 들고 있다가 "지금으로부터 windowMs 이전"에 있는 것만 세는 진짜 슬라이딩 윈도우로
// 구현한다. 배열은 매 호출마다 만료분을 걷어내므로 최대 max개 이하로 유지된다.
export async function checkRateLimit(
  rateLimitRef: DocumentReference,
  windowMs: number,
  max: number
): Promise<boolean> {
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(rateLimitRef)
    const now = Date.now()
    const recentAttempts = ((snap.data()?.attempts as number[] | undefined) ?? [])
      .filter((t) => now - t < windowMs)

    if (recentAttempts.length >= max) {
      tx.set(rateLimitRef, { attempts: recentAttempts })
      return false
    }

    recentAttempts.push(now)
    tx.set(rateLimitRef, { attempts: recentAttempts })
    return true
  })
}
