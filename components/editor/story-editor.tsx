'use client'

import { useCallback, useState } from 'react'
import { GripVertical, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { type StoryItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { resizeImageToDataUrl } from '@/lib/image-resize'

const STORY_IMAGE_MAX_DIMENSION = 1200

interface StoryEditorProps {
  items: StoryItem[]
  onAdd: (item: StoryItem) => void
  onUpdate: (id: string, updates: Partial<StoryItem>) => void
  onRemove: (id: string) => void
  onReorder: (items: StoryItem[]) => void
}

export function StoryEditor({ items, onAdd, onUpdate, onRemove, onReorder }: StoryEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const ordered = [...items].sort((a, b) => a.order - b.order)

  const handleAdd = () => {
    onAdd({
      id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: '',
      title: '',
      description: '',
      order: items.length,
    })
  }

  const handleImageSelect = useCallback((id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    resizeImageToDataUrl(file, STORY_IMAGE_MAX_DIMENSION).then((imageUrl) => onUpdate(id, { imageUrl }))
  }, [onUpdate])

  const resetDrag = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedIndex === null || index === draggedIndex) return
    if (index !== dragOverIndex) setDragOverIndex(index)
  }

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) {
      resetDrag()
      return
    }
    const reordered = [...ordered]
    const [moved] = reordered.splice(draggedIndex, 1)
    reordered.splice(index, 0, moved)
    onReorder(reordered.map((item, i) => ({ ...item, order: i })))
    resetDrag()
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">우리의 이야기</h3>
        <p className="text-xs text-muted-foreground">첫 만남부터 프러포즈까지, 두 사람의 이야기를 시간순으로 들려주세요.</p>
      </div>

      {ordered.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
          아직 추가된 이야기가 없어요.
        </div>
      )}

      <div className="space-y-3">
        {ordered.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver(index)}
            onDrop={handleDrop(index)}
            onDragEnd={resetDrag}
            className={cn(
              'rounded-lg border border-border p-3 space-y-3 bg-background transition-all',
              draggedIndex === index && 'opacity-40',
              dragOverIndex === index && draggedIndex !== index && 'ring-2 ring-accent ring-offset-2'
            )}
          >
            <div className="flex items-center gap-2">
              <button type="button" className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </button>
              <div className="flex-1">
                <Input
                  type="date"
                  value={item.date}
                  onChange={(e) => onUpdate(item.id, { date: e.target.value })}
                  className="text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="shrink-0 p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-3">
              <label
                htmlFor={`story-image-${item.id}`}
                className="relative shrink-0 w-16 h-16 rounded-lg border-2 border-dashed overflow-hidden flex items-center justify-center text-muted-foreground cursor-pointer hover:border-accent hover:text-accent transition-colors"
              >
                <input
                  id={`story-image-${item.id}`}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect(item.id)}
                  className="hidden"
                />
                {item.imageUrl ? (
                  <>
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); onUpdate(item.id, { imageUrl: undefined }) }}
                      className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 hover:bg-black/80"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </>
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
              </label>

              <div className="flex-1 space-y-2 min-w-0">
                <Input
                  value={item.title}
                  onChange={(e) => onUpdate(item.id, { title: e.target.value })}
                  placeholder="제목 (예: 우리가 처음 만난 날)"
                  className="text-sm"
                />
                <Textarea
                  value={item.description}
                  onChange={(e) => onUpdate(item.id, { description: e.target.value })}
                  placeholder="짧은 이야기를 남겨보세요"
                  className="text-sm min-h-16 resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={handleAdd}>
        <Plus className="h-4 w-4 mr-1.5" />
        이야기 추가
      </Button>
    </div>
  )
}
