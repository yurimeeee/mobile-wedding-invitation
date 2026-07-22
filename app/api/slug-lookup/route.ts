import { NextResponse, type NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import {
  defaultCalendarSettings,
  defaultShareSettings,
  defaultWeddingInfo,
  defaultMusicSettings,
} from '@/lib/types'

// Firestore 보안 규칙은 status/uid로만 쿼리를 정적으로 검증할 수 있어
// slug 조건만 있는 쿼리는 클라이언트 SDK로 실행할 수 없다. Admin SDK로 우회한다.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')?.trim() ?? ''
  if (!slug) return NextResponse.json({ error: 'slug가 필요합니다.' }, { status: 400 })

  const snap = await adminDb.collection('invitations').where('slug', '==', slug).limit(1).get()
  if (snap.empty) return NextResponse.json({ id: null })

  const docSnap = snap.docs[0]
  const data = docSnap.data()

  // 발행된 청첩장만 공개 조회 허용 (임시저장은 소유자만 볼 수 있어야 함)
  if (data.status !== 'published') return NextResponse.json({ id: null })

  return NextResponse.json({
    id: docSnap.id,
    state: {
      template: data.template ?? 'classic-elegant',
      weddingInfo: data.weddingInfo ?? defaultWeddingInfo,
      musicSettings: data.musicSettings ?? defaultMusicSettings,
      gallery: data.gallery ?? [],
      calendarSettings: data.calendarSettings ?? defaultCalendarSettings,
      shareSettings: data.shareSettings ?? defaultShareSettings,
      slug: data.slug ?? '',
    },
  })
}
