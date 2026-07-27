'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, Circle, Eye, EyeOff, GripVertical, Group, Heart, Loader2, Lock, Minus, Square, Trash2, Type, Ungroup, Unlock, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type CustomElementAsset, type FreeElement, type ShapeKind, shapeKindLabels, MAX_CUSTOM_ELEMENT_FILE_SIZE, MAX_CUSTOM_ELEMENT_DIMENSION } from '@/lib/types';
import { uploadCustomElement, loadCustomElements, deleteCustomElement, CustomElementValidationError } from '@/lib/custom-element-service';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ElementProperties } from '@/components/editor/custom/element-properties';

const stickerLibrary: { id: string; label: string; src: string }[] = [
  { id: 'flower-1', label: '플라워 1', src: '/assets/templates/type_4/flower_1.png' },
  { id: 'flower-2', label: '플라워 2', src: '/assets/templates/type_4/flower_2.png' },
  { id: 'flower-3', label: '플라워 3', src: '/assets/templates/type_4/flower_3.png' },
];

const shapeLibrary: { kind: ShapeKind; icon: typeof Minus; defaults: { x: number; y: number; width: number; height: number } }[] = [
  { kind: 'line', icon: Minus, defaults: { x: 30, y: 15, width: 40, height: 1.5 } },
  { kind: 'rect', icon: Square, defaults: { x: 35, y: 15, width: 30, height: 20 } },
  { kind: 'circle', icon: Circle, defaults: { x: 40, y: 15, width: 20, height: 20 } },
  { kind: 'heart', icon: Heart, defaults: { x: 41, y: 15, width: 18, height: 16 } },
];

const maxSizeLabel = `${MAX_CUSTOM_ELEMENT_FILE_SIZE / (1024 * 1024)}MB`;
const maxDimensionLabel = `${MAX_CUSTOM_ELEMENT_DIMENSION}×${MAX_CUSTOM_ELEMENT_DIMENSION}px`;

function nextZIndex(elements: FreeElement[]) {
  return elements.reduce((max, el) => Math.max(max, el.zIndex), 0) + 1;
}

function elementLabel(el: FreeElement): string {
  if (el.type === 'text') return el.text || '텍스트';
  if (el.type === 'shape') return el.shapeKind ? shapeKindLabels[el.shapeKind] : '도형';
  return '스티커';
}

function MultiSelectPanel({
  elements,
  selectedIds,
  onGroup,
  onUngroup,
  onBack,
}: {
  elements: FreeElement[];
  selectedIds: string[];
  onGroup: () => void;
  onUngroup: () => void;
  onBack: () => void;
}) {
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const isGroup = selectedElements.length > 0 && selectedElements.every((el) => el.groupId && el.groupId === selectedElements[0].groupId);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </button>

      <p className="text-sm font-medium">{selectedElements.length}개 요소 선택됨</p>
      <div className="space-y-1">
        {selectedElements.map((el) => (
          <p key={el.id} className="text-xs text-muted-foreground truncate">
            · {elementLabel(el)}
          </p>
        ))}
      </div>

      {isGroup ? (
        <Button variant="outline" size="sm" className="w-full justify-between" onClick={onUngroup}>
          <span className="flex items-center">
            <Ungroup className="h-4 w-4 mr-1.5" />
            그룹 해제
          </span>
          <span className="text-xs text-muted-foreground">Ctrl/⌘+⇧+G</span>
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="w-full justify-between" onClick={onGroup} disabled={selectedElements.length < 2}>
          <span className="flex items-center">
            <Group className="h-4 w-4 mr-1.5" />
            그룹으로 묶기
          </span>
          <span className="text-xs text-muted-foreground">Ctrl/⌘+G</span>
        </Button>
      )}
      <p className="text-xs text-muted-foreground/70">개별 요소를 편집하려면 그룹을 해제한 뒤 하나만 선택하세요.</p>
    </div>
  );
}

function ElementRow({
  el,
  selected,
  nested,
  onSelect,
  onUpdate,
  onRemove,
}: {
  el: FreeElement;
  selected: boolean;
  nested: boolean;
  onSelect: (id: string | null, opts?: { shift?: boolean }) => void;
  onUpdate: (id: string, updates: Partial<FreeElement>) => void;
  onRemove: (id: string) => void;
}) {
  const hidden = el.visible === false;
  return (
    <div
      onClick={(e) => onSelect(el.id, { shift: e.shiftKey })}
      className={cn(
        'flex items-center gap-1 rounded-lg text-sm cursor-pointer transition-colors',
        nested ? 'px-2 py-1.5' : 'border px-3 py-2',
        selected ? (nested ? 'bg-primary/10' : 'border-primary bg-primary/5') : nested ? '' : 'border-border',
        (hidden || el.locked) && 'opacity-50',
      )}
    >
      <span className="flex-1 truncate">{elementLabel(el)}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUpdate(el.id, { locked: !el.locked });
        }}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={el.locked ? '잠금 해제' : '위치/크기 잠금'}
        title={el.locked ? '잠금 해제' : '위치/크기 잠금'}
      >
        {el.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUpdate(el.id, { visible: hidden ? true : false });
        }}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={hidden ? '보이기' : '숨기기'}
        title={hidden ? '보이기' : '숨기기'}
      >
        {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(el.id);
          if (selected) onSelect(null);
        }}
        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
        aria-label="삭제"
        title="삭제"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

interface Cluster {
  key: string;
  items: FreeElement[];
}

function SortableCluster({
  cluster, selectedIds, onSelect, onUpdate, onRemove,
}: {
  cluster: Cluster;
  selectedIds: string[];
  onSelect: (id: string | null, opts?: { shift?: boolean }) => void;
  onUpdate: (id: string, updates: Partial<FreeElement>) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cluster.key });
  const style = { transform: CSS.Transform.toString(transform), transition };

  if (cluster.items.length === 1) {
    const el = cluster.items[0];
    return (
      <div ref={setNodeRef} style={style} className={cn('flex items-center gap-1', isDragging && 'opacity-50')}>
        <button {...attributes} {...listeners} type="button" className="shrink-0 cursor-grab touch-none p-1 text-muted-foreground" aria-label="순서 변경">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <ElementRow el={el} selected={selectedIds.includes(el.id)} nested={false} onSelect={onSelect} onUpdate={onUpdate} onRemove={onRemove} />
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={cn('rounded-lg border border-accent/50 bg-accent/5 p-1.5 space-y-1', isDragging && 'opacity-50')}>
      <div className="flex items-center gap-1 px-1.5 py-0.5">
        <button {...attributes} {...listeners} type="button" className="shrink-0 cursor-grab touch-none text-accent" aria-label="순서 변경">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <Group className="h-3 w-3 text-accent" />
        <span className="text-[11px] font-medium text-accent">그룹 · {cluster.items.length}개</span>
      </div>
      {cluster.items.map((el) => (
        <ElementRow key={el.id} el={el} selected={selectedIds.includes(el.id)} nested onSelect={onSelect} onUpdate={onUpdate} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ElementList({
  elements,
  selectedIds,
  onSelect,
  onUpdate,
  onRemove,
}: {
  elements: FreeElement[];
  selectedIds: string[];
  onSelect: (id: string | null, opts?: { shift?: boolean }) => void;
  onUpdate: (id: string, updates: Partial<FreeElement>) => void;
  onRemove: (id: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (elements.length === 0) return null;

  // Cluster grouped elements together (visually bracketed, and dragged as one unit)
  // so a group reads and reorders as a single stacking unit in the list.
  const seenGroups = new Set<string>();
  const clusters: Cluster[] = [];
  elements.forEach((el) => {
    if (el.groupId) {
      if (seenGroups.has(el.groupId)) return;
      seenGroups.add(el.groupId);
      clusters.push({ key: el.groupId, items: elements.filter((e) => e.groupId === el.groupId) });
    } else {
      clusters.push({ key: el.id, items: [el] });
    }
  });

  // Front-most (highest zIndex) cluster at the top, matching a typical layer panel.
  const rank = (c: Cluster) => Math.max(...c.items.map((i) => i.zIndex));
  const ordered = [...clusters].sort((a, b) => rank(b) - rank(a));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((c) => c.key === active.id);
    const newIndex = ordered.findIndex((c) => c.key === over.id);
    const moved = arrayMove(ordered, oldIndex, newIndex);
    const total = moved.length;
    moved.forEach((cluster, i) => {
      const zIndex = total - i;
      cluster.items.forEach((item) => {
        if (item.zIndex !== zIndex) onUpdate(item.id, { zIndex });
      });
    });
  };

  return (
    <div>
      <p className="text-sm font-medium mb-2">추가된 요소</p>
      <p className="text-xs text-muted-foreground mb-2">
        Shift+클릭으로 여러 개를 선택해 그룹으로 묶고, 손잡이를 드래그해 쌓임 순서를 바꿀 수 있어요.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
        <SortableContext items={ordered.map((c) => c.key)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {ordered.map((cluster) => (
              <SortableCluster key={cluster.key} cluster={cluster} selectedIds={selectedIds} onSelect={onSelect} onUpdate={onUpdate} onRemove={onRemove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

interface ElementPanelProps {
  uid: string;
  elements: FreeElement[];
  selectedIds: string[];
  onSelect: (id: string | null, opts?: { shift?: boolean }) => void;
  onAdd: (element: FreeElement) => void;
  onUpdate: (id: string, updates: Partial<FreeElement>) => void;
  onRemove: (id: string) => void;
  onGroup: () => void;
  onUngroup: () => void;
  /** Measured mobile canvas pixel size — used to compute an accurate vertical-center position. */
  canvasSize: { width: number; height: number };
}

export function ElementPanel({ uid, elements, selectedIds, onSelect, onAdd, onUpdate, onRemove, onGroup, onUngroup, canvasSize }: ElementPanelProps) {
  const selected = selectedIds.length === 1 ? (elements.find((el) => el.id === selectedIds[0]) ?? null) : null;
  const [myElements, setMyElements] = useState<CustomElementAsset[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!uid) return;
    loadCustomElements(uid)
      .then(setMyElements)
      .catch(() => toast.error('내 요소를 불러오지 못했습니다'));
  }, [uid]);

  const addSticker = (src: string) => {
    const id = crypto.randomUUID();
    onAdd({
      id,
      type: 'sticker',
      src,
      x: 35,
      y: 10,
      width: 30,
      height: 30,
      rotation: 0,
      zIndex: nextZIndex(elements),
      opacity: 1,
      locked: false,
    });
    onSelect(id);
  };

  const addText = () => {
    const id = crypto.randomUUID();
    onAdd({
      id,
      type: 'text',
      text: '텍스트를 입력하세요',
      x: 20,
      y: 10,
      width: 60,
      height: 12,
      rotation: 0,
      zIndex: nextZIndex(elements),
      opacity: 1,
      locked: false,
      color: '#333333',
      fontSize: 5,
      fontFamily: 'sans',
      align: 'center',
      bold: false,
      italic: false,
    });
    onSelect(id);
  };

  const addShape = (shapeKind: ShapeKind) => {
    const preset = shapeLibrary.find((s) => s.kind === shapeKind)!.defaults;
    const id = crypto.randomUUID();
    onAdd({
      id,
      type: 'shape',
      shapeKind,
      ...preset,
      rotation: 0,
      zIndex: nextZIndex(elements),
      opacity: 1,
      locked: false,
      color: '#8B6F47',
    });
    onSelect(id);
  };

  const duplicateElement = (el: FreeElement) => {
    const id = crypto.randomUUID();
    onAdd({
      ...el,
      id,
      x: Math.min(el.x + 4, 100 - el.width),
      y: el.y + 4,
      zIndex: nextZIndex(elements),
    });
    onSelect(id);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uid) return;

    setUploading(true);
    try {
      const asset = await uploadCustomElement(uid, file);
      setMyElements((prev) => [asset, ...prev]);
      toast.success('업로드되었습니다');
    } catch (err) {
      toast.error(err instanceof CustomElementValidationError ? err.message : '업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMyElement = async (assetId: string) => {
    if (!uid) return;
    setMyElements((prev) => prev.filter((a) => a.id !== assetId));
    try {
      await deleteCustomElement(uid, assetId);
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  return (
    <div className="space-y-6">
      {selected && (
        <ElementProperties
          element={selected}
          elements={elements}
          onChange={(updates) => onUpdate(selected.id, updates)}
          onRemove={() => {
            onRemove(selected.id);
            onSelect(null);
          }}
          onDuplicate={() => duplicateElement(selected)}
          onBack={() => onSelect(null)}
          canvasSize={canvasSize}
        />
      )}

      {selectedIds.length > 1 && <MultiSelectPanel elements={elements} selectedIds={selectedIds} onGroup={onGroup} onUngroup={onUngroup} onBack={() => onSelect(null)} />}

      {selectedIds.length === 0 && (
        <>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">디자인 요소</h3>
              <p className="text-sm text-muted-foreground">스티커와 텍스트로 자유롭게 꾸며보세요.</p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {stickerLibrary.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addSticker(s.src)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-border p-2 hover:border-primary transition-colors"
                >
                  <div className="relative w-10 h-10">
                    <Image src={s.src} alt={s.label} fill className="object-contain" />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{s.label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={addText}
                className="flex flex-col items-center justify-center gap-1 rounded-lg border border-border p-2 hover:border-primary transition-colors"
              >
                <Type className="w-6 h-6 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">텍스트</span>
              </button>
              {shapeLibrary.map((s) => (
                <button
                  key={s.kind}
                  type="button"
                  onClick={() => addShape(s.kind)}
                  className="flex flex-col items-center justify-center gap-1 rounded-lg border border-border p-2 hover:border-primary transition-colors"
                >
                  <s.icon className="w-6 h-6 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{shapeKindLabels[s.kind]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">내 요소</p>
              <label className="inline-flex">
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleUpload} className="hidden" disabled={uploading} />
                <span className={cn('inline-flex items-center gap-1 text-xs text-accent hover:underline cursor-pointer', uploading && 'opacity-50 pointer-events-none')}>
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  업로드
                </span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              PNG · JPG · WebP · SVG, {maxSizeLabel} 이하, {maxDimensionLabel} 이하 권장. 업로드한 요소는 나에게만 보여요.
            </p>

            {myElements.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {myElements.map((asset) => (
                  <div key={asset.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => addSticker(asset.url)}
                      className="w-full flex flex-col items-center gap-1 rounded-lg border border-border p-2 hover:border-primary transition-colors"
                    >
                      <div className="relative w-10 h-10">
                        <Image src={asset.url} alt={asset.name} fill className="object-contain" unoptimized />
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate w-full text-center">{asset.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMyElement(asset.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/70">아직 업로드한 요소가 없어요.</p>
            )}
          </div>
        </>
      )}

      <ElementList elements={elements} selectedIds={selectedIds} onSelect={onSelect} onUpdate={onUpdate} onRemove={onRemove} />
    </div>
  );
}
