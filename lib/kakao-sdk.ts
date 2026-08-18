declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Kakao: any
  }
}

let loadPromise: Promise<void> | null = null

// 카카오 공유(share-section)와 카카오 로그인(login/signup)이 같은 JS SDK를 공유한다.
export function loadKakaoSdk(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.Kakao?.isInitialized()) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="developers.kakao.com/sdk"]')
    const onReady = () => {
      if (!window.Kakao.isInitialized()) window.Kakao.init(apiKey)
      resolve()
    }

    if (existing) {
      if (window.Kakao) onReady()
      else existing.addEventListener('load', onReady, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js'
    script.async = true
    script.onload = onReady
    script.onerror = () => reject(new Error('카카오 SDK를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })

  return loadPromise
}

export function kakaoLogin(): Promise<{ access_token: string }> {
  return new Promise((resolve, reject) => {
    window.Kakao.Auth.login({
      success: resolve,
      fail: reject,
    })
  })
}
