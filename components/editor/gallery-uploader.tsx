'use client'

import { useCallback, useState } from 'react'
import { Upload, X, GripVertical, Play } from 'lucide-react'
import { toast } from 'sonner'
import { type GalleryImage } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { resizeImageToDataUrl } from '@/lib/image-resize'

const GALLERY_IMAGE_MAX_DIMENSION = 1600
const GALLERY_VIDEO_MAX_BYTES = 25 * 1024 * 1024

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

interface GalleryUploaderProps {
  images: GalleryImage[]
  onAdd: (image: GalleryImage) => void
  onRemove: (id: string) => void
  onReorder: (images: GalleryImage[]) => void
}

export function GalleryUploader({ images, onAdd, onRemove, onReorder }: GalleryUploaderProps) {
  // 영상은 대표 이미지로 쓰일 수 없으므로, 0번이 영상이어도 "대표" 배지는 실제로
  // 대표 이미지로 쓰이는(처음 나오는 사진) 항목에 붙인다.
  const coverIndex = images.findIndex((img) => img.type !== 'video')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isFileDragOver, setIsFileDragOver] = useState(false)

  const addFiles = useCallback((files: File[]) => {
    files.forEach((file, i) => {
      const id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const order = images.length + i

      if (file.type.startsWith('video/')) {
        if (file.size > GALLERY_VIDEO_MAX_BYTES) {
          toast.error('영상은 25MB 이하만 업로드할 수 있어요')
          return
        }
        // 영상은 createImageBitmap으로 디코드할 수 없어 리사이즈 파이프라인을 타지 않고
        // 원본 그대로 data URL로 읽어 업로드한다.
        readFileAsDataUrl(file).then((url) => {
          onAdd({ id, url, order, type: 'video' })
        })
        return
      }

      if (!file.type.startsWith('image/')) return
      resizeImageToDataUrl(file, GALLERY_IMAGE_MAX_DIMENSION).then((url) => {
        onAdd({ id, url, order, type: 'image' })
      })
    })
  }, [images.length, onAdd])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsFileDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }, [addFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []))
    e.target.value = ''
  }, [addFiles])

  const resetDrag = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleImageDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleImageDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedIndex === null || index === draggedIndex) return
    if (index !== dragOverIndex) setDragOverIndex(index)
  }

  const handleImageDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) {
      resetDrag()
      return
    }
    const reordered = [...images]
    const [moved] = reordered.splice(draggedIndex, 1)
    reordered.splice(index, 0, moved)
    onReorder(reordered.map((img, i) => ({ ...img, order: i })))
    resetDrag()
  }

  const fileInput = (
    <input
      type="file"
      accept="image/*,video/*"
      multiple
      onChange={handleFileSelect}
      className="hidden"
      id="gallery-upload"
    />
  )

  return (
    <div
      className={cn(
        'space-y-4 rounded-lg outline-2 outline-offset-4 outline-dashed transition-colors',
        isFileDragOver ? 'outline-accent bg-accent/5' : 'outline-transparent'
      )}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault()
        if (e.dataTransfer.types.includes('Files')) setIsFileDragOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFileDragOver(false)
      }}
    >
      <div>
        <h3 className="text-base font-semibold mb-1">포토 갤러리</h3>
        <p className="text-xs text-muted-foreground">
          {images.length > 0 ? '첫 번째 사진이 대표 이미지로 사용돼요. 드래그해서 순서를 바꿀 수 있어요.' : '소중한 순간이 담긴 사진이나 영상을 채워보세요.'}
        </p>
      </div>

      {/* Upload area (empty state) */}
      {images.length === 0 && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            "hover:border-accent hover:bg-accent/5"
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">사진/영상을 여기에 드롭하세요</p>
              <p className="text-sm text-muted-foreground">또는 클릭하여 찾아보기</p>
            </div>
            {fileInput}
            <Button variant="outline" size="sm" asChild>
              <label htmlFor="gallery-upload" className="cursor-pointer">
                파일 선택
              </label>
            </Button>
          </div>
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <label
            htmlFor="gallery-upload"
            className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent cursor-pointer"
          >
            {fileInput}
            <Upload className="h-4 w-4" />
            <span className="text-xs">추가</span>
          </label>
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={handleImageDragStart(index)}
              onDragOver={handleImageDragOver(index)}
              onDrop={handleImageDrop(index)}
              onDragEnd={resetDrag}
              className={cn(
                "relative group aspect-square rounded-lg overflow-hidden bg-muted transition-all",
                draggedIndex === index && "opacity-40",
                dragOverIndex === index && draggedIndex !== index && "ring-2 ring-accent ring-offset-2"
              )}
            >
              {image.type === 'video' ? (
                <video
                  src={image.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <img
                  src={image.url}
                  alt=""
                  className="w-full h-full object-cover pointer-events-none"
                />
              )}
              {image.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-black/50">
                    <Play className="h-3.5 w-3.5 text-white fill-white" />
                  </span>
                </div>
              )}
              {index === coverIndex && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium leading-none">
                  대표
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={() => onRemove(image.id)}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-red-500/80 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
