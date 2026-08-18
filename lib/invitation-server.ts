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

// 게스트 청첩장 페이지(발행된 것만)를 slug 우선, 없으면 문서 ID로 조회한다. 서버 컴포넌트의
// generateMetadata()와 본문 렌더 양쪽에서 재사용해 조회를 한 곳으로 모은다.
export async function resolvePublishedInvitation(idOrSlug: string): Promise<ResolvedInvitation> {
  const bySlug = await adminDb.collection('invitations').where('slug', '==', idOrSlug).limit(1).get()
  const docSnap = !bySlug.empty ? bySlug.docs[0] : await adminDb.collection('invitations').doc(idOrSlug).get()

  if (!docSnap.exists) return { kind: 'not-found' }
  const data = docSnap.data()!
  if (data.status !== 'published') return { kind: 'not-found' }
  if (isExpired(data)) return { kind: 'expired' }

  return { kind: 'ok', id: docSnap.id, state: toEditorState(data) }
}
