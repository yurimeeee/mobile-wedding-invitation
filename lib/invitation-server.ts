import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { Timestamp } from 'firebase-admin/firestore'
import { adminDb } from './firebase-admin'
import {
  defaultCalendarSettings, defaultShareSettings, defaultWeddingInfo,
  defaultMusicSettings, defaultPrivacySettings, defaultCustomLayout,
  type EditorState,
} from './types'

export type ResolvedInvitation =
  | { kind: 'ok'; id: string; state: EditorState }
  | { kind: 'expired' }
  | { kind: 'not-found' }

function toEditorState(data: FirebaseFirestore.DocumentData): EditorState {
  return {
    template: data.template ?? 'classic-elegant',
    weddingInfo: { ...defaultWeddingInfo, ...(data.weddingInfo ?? {}) },
    musicSettings: data.musicSettings ?? defaultMusicSettings,
    gallery: data.gallery ?? [],
    calendarSettings: data.calendarSettings ?? defaultCalendarSettings,
    shareSettings: data.shareSettings ?? defaultShareSettings,
    privacySettings: { ...defaultPrivacySettings, ...(data.privacySettings ?? {}) },
    slug: data.slug ?? '',
    mode: data.mode ?? 'template',
    customLayout: data.customLayout ?? defaultCustomLayout,
    introStyle: data.introStyle ?? 'fade',
  }
}

function isExpired(data: FirebaseFirestore.DocumentData): boolean {
  return data.expiresAt instanceof Timestamp && data.expiresAt.toDate() < new Date()
}

async function fetchPublishedInvitation(idOrSlug: string): Promise<ResolvedInvitation> {
  const bySlug = await adminDb.collection('invitations').where('slug', '==', idOrSlug).limit(1).get()
  const docSnap = !bySlug.empty ? bySlug.docs[0] : await adminDb.collection('invitations').doc(idOrSlug).get()

  if (!docSnap.exists) return { kind: 'not-found' }
  const data = docSnap.data()!
  if (data.status !== 'published') return { kind: 'not-found' }
  if (isExpired(data)) return { kind: 'expired' }

  return { kind: 'ok', id: docSnap.id, state: toEditorState(data) }
}

// 게스트 청첩장 페이지(발행된 것만)를 slug 우선, 없으면 문서 ID로 조회한다. 서버 컴포넌트의
// generateMetadata()와 본문 렌더 양쪽에서 재사용해 조회를 한 곳으로 모은다.
// [id]에는 generateStaticParams가 없어 Next의 Full Route Cache(export const revalidate)는
// 이 페이지에 적용되지 않는다 — 대신 조회 자체를 unstable_cache로 60초간 캐싱해, 카카오톡 링크가
// 몰려서 열릴 때마다 매번 Firestore를 다시 때리지 않게 한다. 바깥의 react cache()는 같은 요청
// 안에서 generateMetadata()와 본문 렌더가 두 번 부르는 걸 한 번으로 줄인다.
export const resolvePublishedInvitation = cache(
  unstable_cache(fetchPublishedInvitation, ['resolve-published-invitation'], { revalidate: 60 })
)
