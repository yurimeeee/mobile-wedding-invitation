'use client';

import { Check } from 'lucide-react';
import { type IntroStyle, introStyleLabels } from '@/lib/types';
import { cn } from '@/lib/utils';

const introStyles: IntroStyle[] = ['fade', 'slide-up', 'zoom', 'none'];

interface IntroStylePickerProps {
  value: IntroStyle;
  onChange: (style: IntroStyle) => void;
}

export function IntroStylePicker({ value, onChange }: IntroStylePickerProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">등장 효과</p>
        <p className="text-xs text-muted-foreground">청첩장을 처음 열었을 때 콘텐츠가 나타나는 방식이에요.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {introStyles.map((style) => {
          const label = introStyleLabels[style];
          const selected = value === style;
          return (
            <button
              key={style}
              type="button"
              onClick={() => onChange(style)}
              className={cn(
                'relative text-left rounded-lg border-2 p-3 transition-colors',
                selected ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
              )}
            >
              {selected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-accent-foreground" />
                </div>
              )}
              <p className="text-sm font-medium mb-0.5">{label.name}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{label.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
