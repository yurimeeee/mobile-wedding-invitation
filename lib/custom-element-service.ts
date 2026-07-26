import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'
import { type CustomElementAsset, MAX_CUSTOM_ELEMENT_FILE_SIZE, MAX_CUSTOM_ELEMENT_DIMENSION } from './types'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

export class CustomElementValidationError extends Error {}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('이미지를 읽을 수 없습니다'))
    img.src = dataUrl
  })
}

export async function uploadCustomElement(uid: string, file: File): Promise<CustomElementAsset> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new CustomElementValidationError('PNG, JPG, WebP, SVG 파일만 업로드할 수 있어요.')
  }
  if (file.size > MAX_CUSTOM_ELEMENT_FILE_SIZE) {
    throw new CustomElementValidationError(`파일 크기는 ${MAX_CUSTOM_ELEMENT_FILE_SIZE / (1024 * 1024)}MB 이하여야 해요.`)
  }

  const dataUrl = await readAsDataUrl(file)

  // SVG는 브라우저에 따라 naturalWidth/Height가 0으로 나올 수 있어 크기 검사를 건너뛴다.
  const { width, height } = file.type !== 'image/svg+xml'
    ? await getImageDimensions(dataUrl)
    : { width: 0, height: 0 }
  if (width > MAX_CUSTOM_ELEMENT_DIMENSION || height > MAX_CUSTOM_ELEMENT_DIMENSION) {
    throw new CustomElementValidationError(`이미지 크기는 ${MAX_CUSTOM_ELEMENT_DIMENSION}×${MAX_CUSTOM_ELEMENT_DIMENSION}px 이하여야 해요.`)
  }

  const id = doc(collection(db, 'users', uid, 'customElements')).id
  const storageRef = ref(storage, `users/${uid}/elements/${id}`)
  await uploadString(storageRef, dataUrl, 'data_url')
  const url = await getDownloadURL(storageRef)

  const asset: CustomElementAsset = {
    id,
    url,
    name: file.name.replace(/\.[^/.]+$/, '').slice(0, 40) || '내 요소',
    width,
    height,
    createdAt: new Date().toISOString(),
  }

  await setDoc(doc(db, 'users', uid, 'customElements', id), asset)
  return asset
}

export async function loadCustomElements(uid: string): Promise<CustomElementAsset[]> {
  const q = query(collection(db, 'users', uid, 'customElements'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => d.data() as CustomElementAsset)
}

// Firestore 문서만 지워 목록(피커)에서 제거한다 — Storage 파일은 남겨두는데, 이미 다른
// 청첩장에 배치된 요소가 이 파일 URL을 계속 참조하고 있을 수 있어 깨진 이미지가 되는 걸 막기 위함이다.
export async function deleteCustomElement(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'customElements', id))
}
