'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, Trash2, Type, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { type CustomElementAsset, type FreeElement, MAX_CUSTOM_ELEMENT_FILE_SIZE, MAX_CUSTOM_ELEMENT_DIMENSION } from '@/lib/types';
import { uploadCustomElement, loadCustomElements, deleteCustomElement, CustomElementValidationError } from '@/lib/custom-element-service';
import { cn } from '@/lib/utils';
import { ElementProperties } from '@/components/editor/custom/element-properties';

const stickerLibrary: { id: string; label: string; src: string }[] = [
  { id: 'flower-1', label: '플라워 1', src: '/assets/templates/type_4/flower_1.png' },
  { id: 'flower-2', label: '플라워 2', src: '/assets/templates/type_4/flower_2.png' },
  { id: 'flower-3', label: '플라워 3', src: '/assets/templates/type_4/flower_3.png' },
];

const maxSizeLabel = `${MAX_CUSTOM_ELEMENT_FILE_SIZE / (1024 * 1024)}MB`;
const maxDimensionLabel = `${MAX_CUSTOM_ELEMENT_DIMENSION}×${MAX_CUSTOM_ELEMENT_DIMENSION}px`;

function nextZIndex(elements: FreeElement[]) {
  return elements.reduce((max, el) => Math.max(max, el.zIndex), 0) + 1;
}

interface ElementPanelProps {
  uid: string;
  elements: FreeElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (element: FreeElement) => void;
  onUpdate: (id: string, updates: Partial<FreeElement>) => void;
  onRemove: (id: string) => void;
}

export function ElementPanel({ uid, elements, selectedId, onSelect, onAdd, onUpdate, onRemove }: ElementPanelProps) {
  const selected = elements.find((el) => el.id === selectedId) ?? null;
  const [myElements, setMyElements] = useState<CustomElementAsset[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!uid) return;
    loadCustomElements(uid).then(setMyElements).catch(() => toast.error('내 요소를 불러오지 못했습니다'));
  }, [uid]);

  const addSticker = (src: string) => {
    const id = crypto.randomUUID();
    onAdd({
      id, type: 'sticker', src,
      x: 35, y: 10, width: 30, height: 30,
      rotation: 0, zIndex: nextZIndex(elements), opacity: 1, locked: false,
    });
    onSelect(id);
  };

  const addText = () => {
    const id = crypto.randomUUID();
    onAdd({
      id, type: 'text', text: '텍스트를 입력하세요',
      x: 20, y: 10, width: 60, height: 12,
      rotation: 0, zIndex: nextZIndex(elements), opacity: 1, locked: false,
      color: '#333333', fontSize: 5, fontFamily: 'sans', align: 'center', bold: false, italic: false,
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

  if (selected) {
    return (
      <ElementProperties
        element={selected}
        elements={elements}
        onChange={(updates) => onUpdate(selected.id, updates)}
        onRemove={() => {
          onRemove(selected.id);
          onSelect(null);
        }}
        onBack={() => onSelect(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          스티커나 텍스트를 추가한 뒤, 모바일 미리보기에서 직접 드래그해 위치와 크기를 조절하세요.
        </p>
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
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium">내 요소</p>
          <label className="inline-flex">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            <span className={cn(
              'inline-flex items-center gap-1 text-xs text-accent hover:underline cursor-pointer',
              uploading && 'opacity-50 pointer-events-none'
            )}>
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

      {elements.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">추가된 요소</p>
          <div className="space-y-2">
            {elements.map((el) => (
              <div
                key={el.id}
                onClick={() => onSelect(el.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors',
                  el.id === selectedId ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <span className="flex-1 truncate">{el.type === 'text' ? (el.text || '텍스트') : '스티커'}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(el.id);
                    if (el.id === selectedId) onSelect(null);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
