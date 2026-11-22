import { createHash, timingSafeEqual } from 'crypto'

// 길이가 다른 문자열을 그대로 timingSafeEqual에 넘기면 길이가 다르다는 이유로 예외가
// 나므로, 고정 길이 해시로 먼저 맞춘 뒤 비교한다 — 문자열 길이 자체도 타이밍으로 새지 않는다.
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}
