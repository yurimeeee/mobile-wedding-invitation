'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { type TemplateType, templates } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  selected: TemplateType;
  onSelect: (template: TemplateType) => void;
}

const templateGradients: Record<TemplateType, string> = {
  'classic-elegant': 'from-amber-50 to-amber-100',
  'modern-minimal': 'from-gray-50 to-gray-100',
  'floral-romantic': 'from-rose-50 to-rose-100',
  'dark-luxury': 'from-gray-800 to-gray-900',
  'korean-traditional': 'from-orange-50 to-orange-100',
};

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-1">템플릿</h3>
        <p className="text-sm text-muted-foreground">디자인 템플릿을 선택해주세요</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {templates.map((template) => (
          <motion.button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={cn(
              'relative rounded-lg border-2 overflow-hidden transition-all',
              selected === template.id ? 'border-accent ring-2 ring-accent/20' : 'border-border hover:border-accent/50',
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={cn('aspect-[3/4] bg-gradient-to-br flex flex-col items-center justify-center p-3', templateGradients[template.id])}>
              <div className={cn('w-8 h-8 rounded-full mb-2', template.id === 'dark-luxury' ? 'bg-white/20' : 'bg-black/10')} />
              <div className={cn('h-1.5 w-12 rounded mb-1', template.id === 'dark-luxury' ? 'bg-white/20' : 'bg-black/10')} />
              <div className={cn('h-1 w-8 rounded', template.id === 'dark-luxury' ? 'bg-white/20' : 'bg-black/10')} />
            </div>

            <div className="p-2 bg-background">
              <p className="text-xs font-medium truncate">{template.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{template.nameKr}</p>
            </div>

            {selected === template.id && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                <Check className="h-3 w-3 text-accent-foreground" />
              </div>
            )}

            {/* Color palette preview */}
            <div className="absolute bottom-12 left-2 flex gap-0.5">
              {template.colors.map((color, i) => (
                <div key={i} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
