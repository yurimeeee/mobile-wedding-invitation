'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[global-error]', error)
  }, [error])

  return (
    <html lang="ko">
      <body>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '0 1rem', textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>문제가 발생했어요</h1>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem' }}>
            페이지를 불러오는 중 오류가 발생했습니다.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: 'none',
              background: '#111', color: '#fff', fontSize: '0.875rem', cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
