// 네이버지도/티맵 앱 스킴으로 길찾기를 시도하고, 앱이 설치되어 있지 않으면(화면 전환이
// 없으면) 스토어 페이지(모바일) 또는 지도 웹 검색(데스크톱)으로 대체 이동한다.
function isIOS(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent)
}

function openWithFallback(scheme: string, fallbackUrl: string) {
  if (!isIOS() && !isAndroid()) {
    window.open(fallbackUrl, '_blank')
    return
  }

  window.location.href = scheme
  setTimeout(() => {
    if (document.hidden) return // 앱이 열려 화면이 전환된 경우
    window.location.href = fallbackUrl
  }, 1500)
}

export function openNaverMapDirections(name: string, lat: number, lng: number) {
  const encodedName = encodeURIComponent(name)
  const scheme = `nmap://route/public?dlat=${lat}&dlng=${lng}&dname=${encodedName}&appname=wedding-invitation-builder`
  const fallback = isIOS()
    ? 'https://apps.apple.com/kr/app/id311867728'
    : isAndroid()
      ? 'https://play.google.com/store/apps/details?id=com.nhn.android.nmap'
      : `https://map.naver.com/p/search/${encodedName}`
  openWithFallback(scheme, fallback)
}

export function openTmapDirections(name: string, lat: number, lng: number) {
  const scheme = `tmap://route?goalname=${encodeURIComponent(name)}&goalx=${lng}&goaly=${lat}`
  const fallback = isIOS()
    ? 'https://apps.apple.com/kr/app/id431589174'
    : 'https://play.google.com/store/apps/details?id=com.skt.tmap.ku'
  openWithFallback(scheme, fallback)
}
