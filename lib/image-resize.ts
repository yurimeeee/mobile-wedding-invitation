const DEFAULT_QUALITY = 0.85

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// 폰 카메라 사진(수 MB~십수 MB)을 리사이즈 없이 그대로 올리면 에디터 상태가 무거워지고
// 업로드/저장이 느려지며 Storage 비용도 늘어난다. maxDimension을 넘는 원본만 축소하고
// JPEG로 재인코딩해 크기를 크게 줄인다 — 사진 콘텐츠 용도라 투명도 보존은 필요 없다.
// GIF(애니메이션 손실)와 SVG(이미 벡터라 축소 이득이 없음)는 원본 그대로 둔다.
export async function resizeImageToDataUrl(
  file: File,
  maxDimension: number,
  quality: number = DEFAULT_QUALITY
): Promise<string> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return readAsDataUrl(file)
  }

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return readAsDataUrl(file)
    }

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    // 브라우저가 createImageBitmap/canvas를 지원하지 않거나 디코딩에 실패해도
    // 업로드 자체는 막지 않고 원본 그대로 폴백한다.
    return readAsDataUrl(file)
  }
}
