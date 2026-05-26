'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

// ─── Kakao Maps SDK types ───────────────────────────────────────────────────
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumAddressData) => void
      }) => { open: () => void }
    }
    kakao: {
      maps: {
        load: (callback: () => void) => void
        Map: new (container: HTMLElement, options: object) => KakaoMapInstance
        LatLng: new (lat: number, lng: number) => KakaoLatLng
        Marker: new (options: { map: KakaoMapInstance; position: KakaoLatLng }) => KakaoMarker
        services: {
          Geocoder: new () => KakaoGeocoder
          Status: { OK: string }
        }
      }
    }
  }
}

interface DaumAddressData {
  roadAddress: string
  jibunAddress: string
  zonecode: string
}
interface KakaoLatLng { getLat(): number; getLng(): number }
interface KakaoMapInstance { setCenter(l: KakaoLatLng): void }
interface KakaoMarker { setPosition(l: KakaoLatLng): void }
interface KakaoGeocoder {
  addressSearch(addr: string, cb: (result: { x: string; y: string }[], status: string) => void): void
}

// ─── 전역 SDK 로드 (중복 방지) ───────────────────────────────────────────────
let kakaoLoadPromise: Promise<void> | null = null

function loadKakaoSdk(): Promise<void> {
  if (kakaoLoadPromise) return kakaoLoadPromise
  kakaoLoadPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps?.Map) { resolve(); return }

    const existing = document.querySelector<HTMLScriptElement>('script[src*="dapi.kakao.com"]')
    const init = () => window.kakao.maps.load(resolve)

    if (existing) {
      window.kakao ? init() : existing.addEventListener('load', init)
      return
    }

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`
    script.async = true
    script.onload = init
    script.onerror = () => reject(new Error('Kakao SDK 로드 실패'))
    document.head.appendChild(script)
  })
  return kakaoLoadPromise
}

function loadDaumPostcode(): Promise<void> {
  return new Promise((resolve) => {
    if (window.daum?.Postcode) { resolve(); return }
    const existing = document.querySelector('script[src*="postcode.v2"]')
    if (existing) { existing.addEventListener('load', () => resolve()); return }

    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

// ─── 지도 표시 (미리보기 / 결과물) ──────────────────────────────────────────
interface KakaoMapDisplayProps {
  address: string
  latitude?: number
  longitude?: number
  venueName?: string
  isDark?: boolean
}

export function KakaoMapDisplay({
  address,
  latitude = 37.5665,
  longitude = 126.9780,
  venueName,
  isDark = false,
}: KakaoMapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<KakaoMapInstance | null>(null)
  const markerRef = useRef<KakaoMarker | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    loadKakaoSdk().then(() => setIsLoaded(true)).catch(() => setLoadError(true))
  }, [])

  // 최초 지도 생성
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return
    const center = new window.kakao.maps.LatLng(latitude, longitude)
    const map = new window.kakao.maps.Map(mapRef.current, { center, level: 3 })
    const marker = new window.kakao.maps.Marker({ map, position: center })
    mapInstanceRef.current = map
    markerRef.current = marker
  }, [isLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // 좌표 변경 시 위치 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return
    const coords = new window.kakao.maps.LatLng(latitude, longitude)
    mapInstanceRef.current.setCenter(coords)
    markerRef.current.setPosition(coords)
  }, [latitude, longitude])

  const openKakaoMap = () => {
    const name = encodeURIComponent(venueName || address)
    window.open(`https://map.kakao.com/link/map/${name},${latitude},${longitude}`, '_blank')
  }
  const openNavigation = () => {
    const name = encodeURIComponent(venueName || address)
    window.open(`https://map.kakao.com/link/to/${name},${latitude},${longitude}`, '_blank')
  }

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className={`w-full h-[160px] rounded-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-muted'}`}
      >
        {loadError && (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-xs text-destructive">지도 로드 실패</p>
          </div>
        )}
        {!isLoaded && !loadError && (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="h-6 w-6 text-muted-foreground animate-pulse" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className={`flex-1 ${isDark ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
          onClick={openKakaoMap}
        >
          <MapPin className="h-3 w-3 mr-1" />
          카카오맵
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`flex-1 ${isDark ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
          onClick={openNavigation}
        >
          <Navigation className="h-3 w-3 mr-1" />
          길찾기
        </Button>
      </div>
    </div>
  )
}

// ─── 주소 검색 (편집 폼용) ───────────────────────────────────────────────────
interface AddressSearchProps {
  address: string
  latitude?: number
  longitude?: number
  venueName?: string
  onAddressChange: (address: string) => void
  onLocationChange: (lat: number, lng: number) => void
}

export function AddressSearch({
  address,
  latitude,
  longitude,
  venueName,
  onAddressChange,
  onLocationChange,
}: AddressSearchProps) {
  const [postcodeReady, setPostcodeReady] = useState(false)
  const [kakaoReady, setKakaoReady] = useState(false)

  useEffect(() => {
    loadDaumPostcode().then(() => setPostcodeReady(true))
    loadKakaoSdk().then(() => setKakaoReady(true)).catch(() => {})
  }, [])

  const openPostcode = () => {
    if (!postcodeReady) return
    new window.daum.Postcode({
      oncomplete: (data) => {
        const selectedAddress = data.roadAddress || data.jibunAddress
        onAddressChange(selectedAddress)

        // 주소로 좌표 변환 (Kakao SDK 로드된 경우)
        if (kakaoReady) {
          const geocoder = new window.kakao.maps.services.Geocoder()
          geocoder.addressSearch(selectedAddress, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
              onLocationChange(parseFloat(result[0].y), parseFloat(result[0].x))
            }
          })
        }
      },
    }).open()
  }

  return (
    <div className="space-y-2">
      <Label>주소</Label>
      <div className="flex gap-2">
        <div className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm min-h-9 flex items-center">
          {address || <span className="text-muted-foreground">주소 검색 후 자동 입력</span>}
        </div>
        <Button type="button" variant="outline" onClick={openPostcode} disabled={!postcodeReady}>
          <Search className="h-4 w-4 mr-1" />
          검색
        </Button>
      </div>

      {/* 선택된 주소의 지도 미리보기 */}
      {address && (
        <KakaoMapDisplay
          address={address}
          latitude={latitude}
          longitude={longitude}
          venueName={venueName}
        />
      )}
    </div>
  )
}

// 하위 호환 export (기존 코드에서 KakaoMap으로 쓰는 곳)
export { KakaoMapDisplay as KakaoMap }
