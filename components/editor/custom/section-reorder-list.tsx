'use client';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { sectionKindLabels, type SectionInstance } from '@/lib/types';
import { cn } from '@/lib/utils';

function SortableRow({ section, onToggle }: { section: SectionInstance; onToggle: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2',
        isDragging && 'opacity-50',
        !section.visible && 'opacity-40'
      )}
    >
      <button {...attributes} {...listeners} type="button" className="shrink-0 cursor-grab touch-none text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm">{sectionKindLabels[section.kind]}</span>
      <button type="button" onClick={() => onToggle(section.id)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
        {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function SectionReorderList({
  sections, onReorder, onToggleVisibility,
}: {
  sections: SectionInstance[];
  onReorder: (sections: SectionInstance[]) => void;
  onToggleVisibility: (id: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ordered = [...sections].sort((a, b) => a.order - b.order);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((s) => s.id === active.id);
    const newIndex = ordered.findIndex((s) => s.id === over.id);
    const moved = arrayMove(ordered, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
    onReorder(moved);
  };

  return (
    <div className="min-w-0 w-full">
      <p className="text-sm text-muted-foreground mb-3">드래그해서 섹션 순서를 바꾸고, 눈 아이콘으로 표시 여부를 정할 수 있어요.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
        <SortableContext items={ordered.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="min-w-0 space-y-2">
            {ordered.map((s) => (
              <SortableRow key={s.id} section={s} onToggle={onToggleVisibility} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
