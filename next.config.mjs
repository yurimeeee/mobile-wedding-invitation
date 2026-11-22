import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 홈 디렉토리에 남아있는 다른 lockfile 때문에 Turbopack이 워크스페이스 루트를
  // 잘못 추론해 tailwindcss를 찾지 못하는 문제가 있어 루트를 명시한다.
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },
}

export default nextConfig
