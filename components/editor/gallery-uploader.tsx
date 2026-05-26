'use client'

import { useCallback } from 'react'
import { Upload, X, GripVertical, Image as ImageIcon } from 'lucide-react'
import { type GalleryImage } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GalleryUploaderProps {
  images: GalleryImage[]
  onAdd: (image: GalleryImage) => void
  onRemove: (id: string) => void
  onReorder: (images: GalleryImage[]) => void
}

export function GalleryUploader({ images, onAdd, onRemove }: GalleryUploaderProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => {
          onAdd({
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: reader.result as string,
            order: images.length,
          })
        }
        reader.readAsDataURL(file)
      }
    })
  }, [images.length, onAdd])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => {
          onAdd({
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: reader.result as string,
            order: images.length,
          })
        }
        reader.readAsDataURL(file)
      }
    })
    e.target.value = ''
  }, [images.length, onAdd])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-1">포토 갤러리</h3>
        <p className="text-sm text-muted-foreground">웨딩 및 약혼 사진을 업로드하세요</p>
      </div>

      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
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
            <p className="font-medium">이미지를 여기에 드롭하세요</p>
            <p className="text-sm text-muted-foreground">또는 클릭하여 찾아보기</p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="gallery-upload"
          />
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="gallery-upload" className="cursor-pointer">
              파일 선택
            </label>
          </Button>
        </div>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={image.url}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors cursor-grab">
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

      {/* Empty state */}
      {images.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">아직 업로드된 사진이 없어요</p>
        </div>
      )}
    </div>
  )
}
