import {
  doc, setDoc, getDoc, getDocs, deleteDoc,
  collection, query, where, serverTimestamp, Timestamp, limit,
} from 'firebase/firestore'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'
import type { EditorState, GalleryImage } from './types'
import { defaultCalendarSettings, defaultShareSettings, defaultWeddingInfo, defaultMusicSettings } from './types'

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

export async function saveInvitation(
  uid: string,
  invitationId: string,
  state: EditorState,
  status: 'draft' | 'published'
): Promise<GalleryImage[]> {
  const gallery = await uploadNewImages(uid, invitationId, state.gallery)

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
      musicSettings: state.musicSettings,
      gallery,
      calendarSettings: state.calendarSettings,
      shareSettings: state.shareSettings,
      slug: state.slug || '',
      status,
      updatedAt: serverTimestamp(),
      ...(!snap.exists() && { createdAt: serverTimestamp() }),
    },
    { merge: true }
  )

  return gallery
}

export async function loadInvitation(invitationId: string): Promise<EditorState | null> {
  const snap = await getDoc(doc(db, 'invitations', invitationId))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    template: data.template ?? 'classic-elegant',
    weddingInfo: data.weddingInfo ?? defaultWeddingInfo,
    musicSettings: data.musicSettings ?? defaultMusicSettings,
    gallery: data.gallery ?? [],
    calendarSettings: data.calendarSettings ?? defaultCalendarSettings,
    shareSettings: data.shareSettings ?? defaultShareSettings,
    slug: data.slug ?? '',
  }
}

export async function createNewInvitation(uid: string): Promise<string> {
  const docRef = doc(collection(db, 'invitations'))
  await setDoc(docRef, {
    uid,
    status: 'draft',
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
      }
    })
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export async function deleteInvitation(invitationId: string): Promise<void> {
  await deleteDoc(doc(db, 'invitations', invitationId))
}

export async function loadInvitationBySlug(slug: string): Promise<{ state: EditorState; id: string } | null> {
  const q = query(collection(db, 'invitations'), where('slug', '==', slug), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  const data = docSnap.data()
  return {
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
  }
}

export async function checkSlugAvailable(slug: string, excludeId: string): Promise<boolean> {
  const q = query(collection(db, 'invitations'), where('slug', '==', slug), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return true
  // available if the only match is the current invitation itself
  return snap.docs[0].id === excludeId
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return newRef.id
}
