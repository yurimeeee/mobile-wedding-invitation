import {
  doc, setDoc, getDoc, getDocs, deleteDoc,
  collection, query, where, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'
import type { EditorState, GalleryImage, MusicSettings, ShareSettings } from './types'
import { defaultCalendarSettings, defaultShareSettings, defaultWeddingInfo, defaultMusicSettings, defaultPrivacySettings, defaultCustomLayout } from './types'

async function uploadNewImages(
  uid: string,
  invitationId: string,
  gallery: GalleryImage[]
): Promise<GalleryImage[]> {
  return Promise.all(
    gallery.map(async (img) => {
      if (!img.url.startsWith('data:')) return img
      const storageRef = ref(storage, `invitations/${uid}/${invitationId}/${img.id}`)
      await uploadString(storageRef, img.url, 'data_url')
      const url = await getDownloadURL(storageRef)
      return { ...img, url }
    })
  )
}

async function uploadCustomMusic(
  uid: string,
  invitationId: string,
  musicSettings: MusicSettings
): Promise<MusicSettings> {
  if (!musicSettings.customUrl || !musicSettings.customUrl.startsWith('data:')) return musicSettings
  const storageRef = ref(storage, `invitations/${uid}/${invitationId}/music/custom-track`)
  await uploadString(storageRef, musicSettings.customUrl, 'data_url')
  const customUrl = await getDownloadURL(storageRef)
  return { ...musicSettings, customUrl }
}

async function uploadShareImages(
  uid: string,
  invitationId: string,
  shareSettings: ShareSettings
): Promise<ShareSettings> {
  const uploadIfDataUrl = async (key: string, dataUrl: string) => {
    if (!dataUrl.startsWith('data:')) return dataUrl
    const storageRef = ref(storage, `invitations/${uid}/${invitationId}/share/${key}`)
    await uploadString(storageRef, dataUrl, 'data_url')
    return getDownloadURL(storageRef)
  }

  const [kakaoImg, linkImg] = await Promise.all([
    uploadIfDataUrl('kakao', shareSettings.kakaoImg),
    uploadIfDataUrl('link', shareSettings.linkImg),
  ])

  return { ...shareSettings, kakaoImg, linkImg }
}

export interface SaveInvitationResult {
  gallery: GalleryImage[]
  musicSettings: MusicSettings
  shareSettings: ShareSettings
}

export async function saveInvitation(
  uid: string,
  invitationId: string,
  state: EditorState,
  status: 'draft' | 'published'
): Promise<SaveInvitationResult> {
  const [gallery, musicSettings, shareSettings] = await Promise.all([
    uploadNewImages(uid, invitationId, state.gallery),
    uploadCustomMusic(uid, invitationId, state.musicSettings),
    uploadShareImages(uid, invitationId, state.shareSettings),
  ])

  const { groomLastNameKr, groomFirstNameKr, brideLastNameKr, brideFirstNameKr } = state.weddingInfo
  const title = `${groomLastNameKr}${groomFirstNameKr} & ${brideLastNameKr}${brideFirstNameKr} 웨딩`

  const docRef = doc(db, 'invitations', invitationId)
  const snap = await getDoc(docRef)

  await setDoc(
    docRef,
    {
      uid,
      title,
      template: state.template,
      weddingInfo: state.weddingInfo,
      musicSettings,
      gallery,
      calendarSettings: state.calendarSettings,
      shareSettings,
      privacySettings: state.privacySettings,
      slug: state.slug || '',
      mode: state.mode ?? 'template',
      ...(state.customLayout && { customLayout: state.customLayout }),
      status,
      updatedAt: serverTimestamp(),
      ...(!snap.exists() && { createdAt: serverTimestamp() }),
    },
    { merge: true }
  )

  return { gallery, musicSettings, shareSettings }
}

export async function loadInvitation(invitationId: string): Promise<EditorState | null> {
  const snap = await getDoc(doc(db, 'invitations', invitationId))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    template: data.template ?? 'classic-elegant',
    weddingInfo: { ...defaultWeddingInfo, ...(data.weddingInfo ?? {}) },
    musicSettings: data.musicSettings ?? defaultMusicSettings,
    gallery: data.gallery ?? [],
    calendarSettings: data.calendarSettings ?? defaultCalendarSettings,
    shareSettings: data.shareSettings ?? defaultShareSettings,
    privacySettings: data.privacySettings ?? defaultPrivacySettings,
    slug: data.slug ?? '',
    mode: data.mode ?? 'template',
    customLayout: data.customLayout ?? defaultCustomLayout,
  }
}

export async function createNewInvitation(
  uid: string,
  template?: EditorState['template'],
  slug?: string,
  mode?: EditorState['mode']
): Promise<string> {
  const docRef = doc(collection(db, 'invitations'))
  await setDoc(docRef, {
    uid,
    status: 'draft',
    ...(template && { template }),
    ...(slug && { slug }),
    ...(mode && { mode }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export interface DashboardInvitation {
  id: string
  title: string
  template: string
  status: 'draft' | 'published'
  updatedAt: Date
  groomName: string
  brideName: string
  weddingDate: string
  slug: string
  thumbnail: string
}

export async function loadUserInvitations(uid: string): Promise<DashboardInvitation[]> {
  const q = query(collection(db, 'invitations'), where('uid', '==', uid))
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((docSnap) => {
      const d = docSnap.data()
      const updatedAt =
        d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : new Date()

      return {
        id: docSnap.id,
        title: d.title || '제목 없음',
        template: d.template || 'classic-elegant',
        status: (d.status ?? 'draft') as 'draft' | 'published',
        updatedAt,
        groomName: d.weddingInfo
          ? `${d.weddingInfo.groomLastNameKr}${d.weddingInfo.groomFirstNameKr}`
          : '',
        brideName: d.weddingInfo
          ? `${d.weddingInfo.brideLastNameKr}${d.weddingInfo.brideFirstNameKr}`
          : '',
        weddingDate: d.weddingInfo?.weddingDate ?? '',
        slug: d.slug ?? '',
        thumbnail: d.gallery?.[0]?.url ?? '',
      }
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export async function deleteInvitation(invitationId: string): Promise<void> {
  await deleteDoc(doc(db, 'invitations', invitationId))
}

// slug만으로 거는 쿼리는 Firestore 보안 규칙(status/uid 기반)을 정적으로 통과할 수 없어
// 클라이언트 SDK로 직접 조회할 수 없다. 서버 라우트(Admin SDK)를 통해 조회한다.
export async function loadInvitationBySlug(slug: string): Promise<{ state: EditorState; id: string } | null> {
  const res = await fetch(`/api/slug-lookup?slug=${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error('청첩장 조회에 실패했습니다')
  const data = await res.json()
  if (!data.id) return null
  return { id: data.id, state: data.state }
}

export async function checkSlugAvailable(slug: string, excludeId: string): Promise<boolean> {
  const res = await fetch(
    `/api/slug-availability?slug=${encodeURIComponent(slug)}&excludeId=${encodeURIComponent(excludeId)}`
  )
  if (!res.ok) throw new Error('URL 확인에 실패했습니다')
  const data = await res.json()
  return data.available as boolean
}

export async function duplicateInvitation(uid: string, invitationId: string): Promise<string> {
  const snap = await getDoc(doc(db, 'invitations', invitationId))
  if (!snap.exists()) throw new Error('원본 청첩장을 찾을 수 없습니다')

  const data = snap.data()
  const newRef = doc(collection(db, 'invitations'))
  await setDoc(newRef, {
    ...data,
    uid,
    title: `${data.title || '청첩장'} (복사본)`,
    status: 'draft',
    // 슬러그는 문서마다 고유해야 하므로 복제본은 비워서 자동 생성 ID로 접근하게 합니다.
    slug: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return newRef.id
}
