'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { type TemplateType, templates } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TemplateThumbnail } from '@/components/editor/template-thumbnail';

interface TemplateSelectorProps {
  selected: TemplateType;
  onSelect: (template: TemplateType) => void;
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  const [disabledIds, setDisabledIds] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/template-settings')
      .then((res) => res.json())
      .then((data) => setDisabledIds(data.disabledTemplateIds ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-1">디자인 템플릿</h3>
        <p className="text-sm text-muted-foreground">마음에 드는 템플릿을 선택해 보세요.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {templates.map((template) => {
          const disabled = disabledIds.includes(template.id);
          return (
            <motion.button
              key={template.id}
              onClick={() => !disabled && onSelect(template.id)}
              disabled={disabled}
              className={cn(
                'relative rounded-lg border-2 overflow-hidden transition-all',
                disabled
                  ? 'border-border opacity-50 cursor-not-allowed'
                  : selected === template.id
                    ? 'border-accent ring-2 ring-accent/20'
                    : 'border-border hover:border-accent/50',
              )}
              whileHover={disabled ? undefined : { scale: 1.02 }}
              whileTap={disabled ? undefined : { scale: 0.98 }}
            >
              <div className="aspect-[3/4] w-full overflow-hidden">
                <TemplateThumbnail id={template.id} />
              </div>

              <div className="p-2 bg-background">
                <p className="text-xs font-medium truncate">{template.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {disabled ? '준비 중' : template.nameKr}
                </p>
              </div>

              {!disabled && selected === template.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                  <Check className="h-3 w-3 text-accent-foreground" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
