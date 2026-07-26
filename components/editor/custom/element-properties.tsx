'use client';

import { ArrowLeft, BringToFront, SendToBack, Trash2 } from 'lucide-react';
import type { FreeElement } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface ElementPropertiesProps {
  element: FreeElement;
  elements: FreeElement[];
  onChange: (updates: Partial<FreeElement>) => void;
  onRemove: () => void;
  onBack: () => void;
}

function NumberField({ label, value, onCommit, min, max, step = 1 }: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
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
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isNaN(next)) onCommit(next);
        }}
      />
    </div>
  );
}

export function ElementProperties({ element, elements, onChange, onRemove, onBack }: ElementPropertiesProps) {
  const bringToFront = () => {
    const max = elements.reduce((m, el) => Math.max(m, el.zIndex), 0);
    onChange({ zIndex: max + 1 });
  };

  const sendToBack = () => {
    const min = elements.reduce((m, el) => Math.min(m, el.zIndex), 0);
    onChange({ zIndex: min - 1 });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </button>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {element.type === 'text' && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">텍스트</Label>
          <Textarea
            value={element.text ?? ''}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={2}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="X (%)" value={element.x} min={0} max={100} onCommit={(x) => onChange({ x })} />
        <NumberField label="Y (%)" value={element.y} min={0} onCommit={(y) => onChange({ y })} />
        <NumberField label="폭 (%)" value={element.width} min={2} max={100} onCommit={(width) => onChange({ width })} />
        <NumberField label="높이 (%)" value={element.height} min={2} max={100} onCommit={(height) => onChange({ height })} />
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

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={bringToFront}>
          <BringToFront className="h-4 w-4 mr-1" />
          맨 앞으로
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={sendToBack}>
          <SendToBack className="h-4 w-4 mr-1" />
          맨 뒤로
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <Label className="text-sm">위치/크기 잠금</Label>
        <Switch checked={element.locked} onCheckedChange={(locked) => onChange({ locked })} />
      </div>
    </div>
  );
}
