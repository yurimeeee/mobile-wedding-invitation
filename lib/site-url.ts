// 메타데이터/sitemap의 절대 URL 베이스. 프로덕션에서는 NEXT_PUBLIC_SITE_URL을 설정해야 정확한
// 도메인이 쓰인다 — 없으면 Vercel의 배포 URL, 그마저 없으면 로컬 개발 서버로 폴백한다.
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}
