'use client';

import { RotateCcw } from 'lucide-react';
import type { CanvasBackground } from '@/lib/types';
import { cn } from '@/lib/utils';

const presetColors = ['#FFFFFF', '#FCFDF8', '#F8F4EB', '#FDF2F5', '#F0F4F8', '#181818'];

interface BackgroundPickerProps {
  background: CanvasBackground;
  templateBg: string;
  onChange: (background: CanvasBackground) => void;
}

export function BackgroundPicker({ background, templateBg, onChange }: BackgroundPickerProps) {
  const isOverridden = background.type === 'color' && !!background.value;
  const currentColor = isOverridden ? background.value : templateBg;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">배경색</p>
        {isOverridden && (
          <button
            type="button"
            onClick={() => onChange({ type: 'color', value: '' })}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            템플릿 기본값
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {presetColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange({ type: 'color', value: color })}
            className={cn(
              'h-8 w-8 rounded-full border-2 transition-transform',
              currentColor.toUpperCase() === color.toUpperCase() ? 'border-primary scale-110' : 'border-border'
            )}
            style={{ background: color }}
            aria-label={color}
          />
        ))}
        <label className="relative h-8 w-8 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onChange({ type: 'color', value: e.target.value })}
            className="h-10 w-10 cursor-pointer opacity-0 absolute"
          />
          <span className="text-[10px] text-muted-foreground pointer-events-none">+</span>
        </label>
      </div>
    </div>
  );
}
