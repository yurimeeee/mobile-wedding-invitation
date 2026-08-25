import {
  doc, setDoc, getDoc, getDocs, deleteDoc,
  collection, query, where, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from './firebase'
import type { EditorState, GalleryImage, MusicSettings, ShareSettings, StoryItem } from './types'
import { AUTO_EXPIRE_DAYS, defaultCalendarSettings, defaultShareSettings, defaultWeddingInfo, defaultMusicSettings, defaultPrivacySettings, defaultCustomLayout, defaultStoryItems, reconcileSections } from './types'
import { saveVersionSnapshot } from './version-service'

function computeExpiresAt(state: EditorState): Timestamp | null {
  if (!state.privacySettings.autoExpireEnabled || !state.weddingInfo.weddingDate) return null
  const weddingDate = new Date(state.weddingInfo.weddingDate)
  if (Number.isNaN(weddingDate.getTime())) return null
  weddingDate.setDate(weddingDate.getDate() + AUTO_EXPIRE_DAYS)
  return Timestamp.fromDate(weddingDate)
}

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

async function uploadNewStoryImages(
  uid: string,
  invitationId: string,
  storyItems: StoryItem[]
): Promise<StoryItem[]> {
  return Promise.all(
    storyItems.map(async (item) => {
      if (!item.imageUrl || !item.imageUrl.startsWith('data:')) return item
      const storageRef = ref(storage, `invitations/${uid}/${invitationId}/story/${item.id}`)
      await uploadString(storageRef, item.imageUrl, 'data_url')
      const imageUrl = await getDownloadURL(storageRef)
      return { ...item, imageUrl }
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
  storyItems: StoryItem[]
  musicSettings: MusicSettings
  shareSettings: ShareSettings
}

export async function saveInvitation(
  uid: string,
  invitationId: string,
  state: EditorState,
  status: 'draft' | 'published'
): Promise<SaveInvitationResult> {
  const [gallery, storyItems, musicSettings, shareSettings] = await Promise.all([
    uploadNewImages(uid, invitationId, state.gallery),
    uploadNewStoryImages(uid, invitationId, state.storyItems),
    uploadCustomMusic(uid, invitationId, state.musicSettings),
    uploadShareImages(uid, invitationId, state.shareSettings),
  ])

  const { groomLastNameKr, groomFirstNameKr, brideLastNameKr, brideFirstNameKr } = state.weddingInfo
  const title = `${groomLastNameKr}${groomFirstNameKr} & ${brideLastNameKr}${brideFirstNameKr} 웨딩`

  const docRef = doc(db, 'invitations', invitationId)
  const snap = await getDoc(docRef)
  const savedState = { ...state, gallery, storyItems, musicSettings, shareSettings }

  // 잠금 비밀번호는 invitations/{id} 문서에 두지 않는다 — 그 문서는 발행되면 누구나 읽을 수
  // 있어서(firestore.rules) 평문 비밀번호가 그대로 노출된다. 소유자만 읽고 쓸 수 있는
  // private/lock 서브문서에 따로 저장한다.
  const { lockPassword, ...publicPrivacySettings } = state.privacySettings

  await setDoc(
    docRef,
    {
      uid,
      title,
      template: state.template,
      weddingInfo: state.weddingInfo,
      musicSettings,
      gallery,
      storyItems,
      calendarSettings: state.calendarSettings,
      shareSettings,
      privacySettings: publicPrivacySettings,
      slug: state.slug || '',
      mode: state.mode ?? 'template',
      introStyle: state.introStyle ?? 'fade',
      ...(state.customLayout && { customLayout: state.customLayout }),
      status,
      expiresAt: computeExpiresAt(state),
      updatedAt: serverTimestamp(),
      ...(!snap.exists() && { createdAt: serverTimestamp() }),
    },
    { merge: true }
  )

  await setDoc(doc(db, 'invitations', invitationId, 'private', 'lock'), { password: lockPassword })

  await saveVersionSnapshot(invitationId, savedState, status).catch(() => {})

  return { gallery, storyItems, musicSettings, shareSettings }
}

export async function loadInvitation(invitationId: string): Promise<EditorState | null> {
  const [snap, lockSnap] = await Promise.all([
    getDoc(doc(db, 'invitations', invitationId)),
    getDoc(doc(db, 'invitations', invitationId, 'private', 'lock')),
  ])
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    template: data.template ?? 'classic-elegant',
    weddingInfo: { ...defaultWeddingInfo, ...(data.weddingInfo ?? {}) },
    musicSettings: data.musicSettings ?? defaultMusicSettings,
    gallery: data.gallery ?? [],
    storyItems: data.storyItems ?? defaultStoryItems,
    calendarSettings: data.calendarSettings ?? defaultCalendarSettings,
    shareSettings: data.shareSettings ?? defaultShareSettings,
    privacySettings: {
      ...defaultPrivacySettings,
      ...(data.privacySettings ?? {}),
      lockPassword: lockSnap.data()?.password ?? '',
    },
    slug: data.slug ?? '',
    mode: data.mode ?? 'template',
    customLayout: data.customLayout
      ? { ...data.customLayout, sections: reconcileSections(data.customLayout.sections) }
      : defaultCustomLayout,
    introStyle: data.introStyle ?? 'fade',
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
  viewCount: number
  expiresAt: Date | null
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
        viewCount: d.viewCount ?? 0,
        expiresAt: d.expiresAt instanceof Timestamp ? d.expiresAt.toDate() : null,
      }
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export async function deleteInvitation(invitationId: string): Promise<void> {
  await deleteDoc(doc(db, 'invitations', invitationId))
}

export async function recordInvitationView(invitationId: string): Promise<void> {
  const token = await auth.currentUser?.getIdToken().catch(() => undefined)
  await fetch('/api/invitation-view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify({ id: invitationId }),
  }).catch(() => {})
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
  const [snap, lockSnap] = await Promise.all([
    getDoc(doc(db, 'invitations', invitationId)),
    getDoc(doc(db, 'invitations', invitationId, 'private', 'lock')),
  ])
  if (!snap.exists()) throw new Error('원본 청첩장을 찾을 수 없습니다')

  const data = snap.data()
  const newRef = doc(collection(db, 'invitations'))
  await setDoc(newRef, {
    ...data,
    uid,
    title: `${data.title || '청첩장'} (복사본)`,
    status: 'draft',
    viewCount: 0,
    // 슬러그는 문서마다 고유해야 하므로 복제본은 비워서 자동 생성 ID로 접근하게 합니다.
    slug: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  if (lockSnap.exists()) {
    await setDoc(doc(db, 'invitations', newRef.id, 'private', 'lock'), lockSnap.data())
  }
  return newRef.id
}
