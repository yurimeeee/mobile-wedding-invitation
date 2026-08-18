import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const PROFILE_CACHE_KEY = 'wedinvite:lastProfile'

export interface ProfileSnapshot {
  displayName: string | null
  photoURL: string | null
  email: string | null
}

function readCachedProfile(): ProfileSnapshot | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY)
    return raw ? (JSON.parse(raw) as ProfileSnapshot) : null
  } catch {
    return null
  }
}

function writeCachedProfile(user: User | null) {
  try {
    if (!user) {
      localStorage.removeItem(PROFILE_CACHE_KEY)
      return
    }
    const snapshot: ProfileSnapshot = { displayName: user.displayName, photoURL: user.photoURL, email: user.email }
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(snapshot))
  } catch {
    // 프라이빗 브라우징 등에서 localStorage가 막혀 있어도 로그인 자체는 계속되어야 한다
  }
}

export interface UseAuthResult {
  user: User | null
  // onAuthStateChanged는 비동기라 첫 응답 전까지는 user가 무조건 null이다.
  // loading으로 "아직 확인 안 됨"과 "확인했는데 로그아웃 상태"를 구분해야
  // 로그인된 사용자에게 로그아웃 상태의 UI(빈 아바타 등)가 잠깐 스쳐 보이는 걸 막을 수 있다.
  loading: boolean
  // 새로고침 직후 Firebase 세션 복원이 끝나기 전에도 즉시 보여줄 수 있도록,
  // 마지막으로 로그인했던 사용자의 표시 정보를 localStorage에서 미리 읽어온 스냅샷.
  // (헤더 아바타가 이 값 덕분에 로딩 중에도 깜빡이지 않고 바로 표시된다.)
  profile: ProfileSnapshot | null
}

export function useAuthState(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileSnapshot | null>(null)

  // 서버 렌더 결과와 다른 마크업이 그대로 첫 페인트에 노출되지 않도록,
  // 페인트 직전(useLayoutEffect)에 캐시를 읽어 동기적으로 반영한다.
  useLayoutEffect(() => {
    setProfile(readCachedProfile())
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      writeCachedProfile(currentUser)
      setProfile(
        currentUser
          ? { displayName: currentUser.displayName, photoURL: currentUser.photoURL, email: currentUser.email }
          : null
      )
    })
    return () => unsubscribe()
  }, [])

  return { user, loading, profile }
}

export const AuthContext = createContext<UseAuthResult | null>(null)

// 앱 전역에서 로그인 상태를 하나의 구독으로 공유한다 (app/layout.tsx의 AuthProvider가 값을 채운다).
// 페이지마다 onAuthStateChanged를 따로 구독하면 페이지 이동/새로고침 때마다
// 세션 복원을 다시 기다리게 되어 헤더 아바타 등이 깜빡인다.
export function useAuth(): UseAuthResult {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
