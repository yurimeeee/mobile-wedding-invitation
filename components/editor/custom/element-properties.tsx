'use client';

import { AlignCenter, AlignCenterHorizontal, AlignCenterVertical, AlignLeft, AlignRight, ArrowLeft, Bold, BringToFront, Copy, Italic, Lock, SendToBack, Trash2, Unlock } from 'lucide-react';
import type { FreeElement, TextAlign, TextFontFamily } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const textColorPresets = ['#222222', '#555555', '#FFFFFF', '#C9A961', '#B76E79', '#4F46E5'];

interface ElementPropertiesProps {
  element: FreeElement;
  elements: FreeElement[];
  onChange: (updates: Partial<FreeElement>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onBack: () => void;
  canvasSize: { width: number; height: number };
}

function ColorField({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs text-muted-foreground shrink-0">색상</Label>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {textColorPresets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={cn(
              'h-6 w-6 rounded-full border-2 transition-transform',
              color.toUpperCase() === preset.toUpperCase() ? 'border-primary scale-110' : 'border-border'
            )}
            style={{ background: preset }}
            aria-label={preset}
          />
        ))}
        <label className="relative h-6 w-6 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-8 cursor-pointer opacity-0 absolute"
          />
          <span className="text-[9px] text-muted-foreground pointer-events-none">+</span>
        </label>
      </div>
    </div>
  );
}

function NumberField({ label, value, onCommit, min, max, step = 1, disabled }: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={Math.round(value * 10) / 10}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isNaN(next)) onCommit(next);
        }}
      />
    </div>
  );
}

export function ElementProperties({ element, elements, onChange, onRemove, onDuplicate, onBack, canvasSize }: ElementPropertiesProps) {
  const bringToFront = () => {
    const max = elements.reduce((m, el) => Math.max(m, el.zIndex), 0);
    onChange({ zIndex: max + 1 });
  };

  const sendToBack = () => {
    const min = elements.reduce((m, el) => Math.min(m, el.zIndex), 0);
    onChange({ zIndex: min - 1 });
  };

  const centerHorizontal = () => {
    onChange({ x: Math.max(0, 50 - element.width / 2) });
  };

  // y is a % of the dynamic page height (canvasSize.height), while width/height are
  // both % of canvasSize.width — different unit bases, so this needs the actual
  // measured canvas pixel size rather than a plain "50 - height/2" shortcut.
  const centerVertical = () => {
    if (canvasSize.height === 0) return;
    const ph = (element.height / 100) * canvasSize.width;
    const yPercent = ((canvasSize.height / 2 - ph / 2) / canvasSize.height) * 100;
    onChange({ y: Math.max(0, yPercent) });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </button>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onDuplicate} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="복제" title="복제">
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onChange({ locked: !element.locked })}
            className={cn('transition-colors', element.locked ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
            aria-label={element.locked ? '잠금 해제' : '위치/크기 잠금'}
            title={element.locked ? '잠금 해제' : '위치/크기 잠금'}
          >
            {element.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="삭제" title="삭제">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {element.type === 'text' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">텍스트</Label>
            <Textarea
              value={element.text ?? ''}
              onChange={(e) => onChange({ text: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">글꼴</Label>
            <Select
              value={element.fontFamily ?? 'sans'}
              onValueChange={(value) => onChange({ fontFamily: value as TextFontFamily })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sans">고딕</SelectItem>
                <SelectItem value="serif">명조</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">글자 크기</Label>
              <span className="text-xs text-muted-foreground">{Math.round((element.fontSize ?? 5) * 10) / 10}</span>
            </div>
            <Slider
              value={[element.fontSize ?? 5]}
              min={2}
              max={15}
              step={0.5}
              onValueChange={([fontSize]) => onChange({ fontSize })}
            />
          </div>

          <ColorField color={element.color ?? '#333333'} onChange={(color) => onChange({ color })} />

          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">스타일</Label>
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="multiple"
                size="sm"
                value={[element.bold && 'bold', element.italic && 'italic'].filter((v): v is string => !!v)}
                onValueChange={(value) => onChange({ bold: value.includes('bold'), italic: value.includes('italic') })}
              >
                <ToggleGroupItem value="bold" aria-label="굵게">
                  <Bold className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="italic" aria-label="기울임">
                  <Italic className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup
                type="single"
                size="sm"
                value={element.align ?? 'center'}
                onValueChange={(value) => value && onChange({ align: value as TextAlign })}
              >
                <ToggleGroupItem value="left" aria-label="왼쪽 정렬">
                  <AlignLeft className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="center" aria-label="가운데 정렬">
                  <AlignCenter className="h-3.5 w-3.5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="right" aria-label="오른쪽 정렬">
                  <AlignRight className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>
      )}

      {element.type === 'shape' && (
        <ColorField color={element.color ?? '#8B6F47'} onChange={(color) => onChange({ color })} />
      )}

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="X (%)" value={element.x} min={0} max={100} onCommit={(x) => onChange({ x })} disabled={element.locked} />
        <NumberField label="Y (%)" value={element.y} min={0} onCommit={(y) => onChange({ y })} disabled={element.locked} />
        <NumberField label="폭 (%)" value={element.width} min={2} max={100} onCommit={(width) => onChange({ width })} disabled={element.locked} />
        <NumberField label="높이 (%)" value={element.height} min={2} max={100} onCommit={(height) => onChange({ height })} disabled={element.locked} />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={centerHorizontal} disabled={element.locked} aria-label="가로 중앙 정렬" title="가로 중앙 정렬">
          <AlignCenterHorizontal className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={centerVertical}
          disabled={element.locked || canvasSize.height === 0}
          aria-label="세로 중앙 정렬"
          title="세로 중앙 정렬"
        >
          <AlignCenterVertical className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={bringToFront} aria-label="맨 앞으로" title="맨 앞으로">
          <BringToFront className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={sendToBack} aria-label="맨 뒤로" title="맨 뒤로">
          <SendToBack className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">회전</Label>
          <span className="text-xs text-muted-foreground">{Math.round(element.rotation)}°</span>
        </div>
        <Slider
          value={[element.rotation]}
          min={-180}
          max={180}
          step={1}
          onValueChange={([rotation]) => onChange({ rotation })}
          disabled={element.locked}
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">투명도</Label>
          <span className="text-xs text-muted-foreground">{Math.round(element.opacity * 100)}%</span>
        </div>
        <Slider
          value={[element.opacity * 100]}
          min={10}
          max={100}
          step={5}
          onValueChange={([opacity]) => onChange({ opacity: opacity / 100 })}
        />
      </div>

    </div>
  );
}
