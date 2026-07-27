'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Monitor, Music } from 'lucide-react';
import { type EditorState, type FreeElement, defaultCustomLayout } from '@/lib/types';
import { resolvePreviewStyle } from '@/lib/preview-style';
import { Button } from '@/components/ui/button';
import { sectionRegistry } from '@/components/invitation/sections/section-registry';

// Konva touches the DOM at import time, so it must never be part of the server bundle.
const FreeElementCanvas = dynamic(
  () => import('@/components/editor/custom/free-element-canvas').then((m) => m.FreeElementCanvas),
  { ssr: false }
);

interface InvitationPreviewProps {
  state: EditorState;
  invitationId: string;
  elementsEditable?: boolean;
  selectedElementIds?: string[];
  onSelectElement?: (id: string | null, opts?: { shift?: boolean }) => void;
  onChangeElement?: (id: string, updates: Partial<FreeElement>) => void;
  /** Fires with the measured mobile canvas's actual pixel size — needed by callers
   * that want to compute positions in real px (e.g. vertical centering), since
   * FreeElement.y is a % of this dynamic page height, not of canvasWidth like
   * x/width/height are. */
  onCanvasSize?: (size: { width: number; height: number }) => void;
}

export function InvitationPreview({
  state,
  invitationId,
  elementsEditable = false,
  selectedElementIds = [],
  onSelectElement,
  onChangeElement,
  onCanvasSize,
}: InvitationPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const cfg = resolvePreviewStyle(state);

  return (
    <div className="flex flex-col h-full">
      {/* Preview controls */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-medium">미리보기</h3>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button variant={previewMode === 'mobile' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewMode('mobile')}>
            <Smartphone className="h-4 w-4 mr-1" />
            모바일
          </Button>
          <Button variant={previewMode === 'desktop' ? 'default' : 'ghost'} size="sm" onClick={() => setPreviewMode('desktop')}>
            <Monitor className="h-4 w-4 mr-1" />
            데스크탑
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-4 bg-muted/30 flex items-start justify-center">
        <AnimatePresence mode="wait">
          {previewMode === 'mobile' ? (
            <motion.div key="mobile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="phone-frame">
              <div className="phone-notch" />
              <div className="phone-screen w-[320px] h-[640px]" style={{ background: cfg.bg }}>
                <MobileCanvasStage
                  state={state}
                  cfg={cfg}
                  invitationId={invitationId}
                  elementsEditable={elementsEditable}
                  selectedElementIds={selectedElementIds}
                  onSelectElement={onSelectElement}
                  onChangeElement={onChangeElement}
                  onCanvasSize={onCanvasSize}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="desktop"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-lg shadow-2xl overflow-auto border border-border"
              style={{ maxHeight: 'calc(100vh - 200px)', background: cfg.bg }}
            >
              <PreviewContent state={state} cfg={cfg} invitationId={invitationId} isDesktop />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface MobileCanvasStageProps {
  state: EditorState;
  cfg: ReturnType<typeof resolvePreviewStyle>;
  invitationId: string;
  elementsEditable: boolean;
  selectedElementIds: string[];
  onSelectElement?: (id: string | null, opts?: { shift?: boolean }) => void;
  onChangeElement?: (id: string, updates: Partial<FreeElement>) => void;
  onCanvasSize?: (size: { width: number; height: number }) => void;
}

// Wraps PreviewContent with an absolutely-positioned Konva stage on top, sized to match
// the content's natural (scrollable) height so free elements scroll together with the page.
function MobileCanvasStage({
  state, cfg, invitationId, elementsEditable, selectedElementIds, onSelectElement, onChangeElement, onCanvasSize,
}: MobileCanvasStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const next = { width: entry.contentRect.width, height: entry.contentRect.height };
      setSize(next);
      onCanvasSize?.(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onCanvasSize]);

  const elements = state.customLayout?.freeElements ?? [];

  return (
    <div className="w-full h-full overflow-y-auto">
      <div ref={containerRef} className="relative">
        <PreviewContent state={state} cfg={cfg} invitationId={invitationId} />
        {elements.length > 0 && (
          <FreeElementCanvas
            elements={elements}
            canvasWidth={size.width}
            canvasHeight={size.height}
            interactive={elementsEditable}
            selectedIds={selectedElementIds}
            onSelect={(id) => onSelectElement?.(id)}
            onChange={(id, updates) => onChangeElement?.(id, updates)}
            handleColor={cfg.accent}
          />
        )}
      </div>
    </div>
  );
}

interface PreviewContentProps {
  state: EditorState;
  cfg: ReturnType<typeof resolvePreviewStyle>;
  invitationId: string;
  isDesktop?: boolean;
}

function PreviewContent({ state, cfg, invitationId }: PreviewContentProps) {
  const { musicSettings } = state;
  const sections = [...(state.customLayout?.sections ?? defaultCustomLayout.sections)]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div style={{ color: cfg.text }}>
      {sections.map((section) => {
        const Block = sectionRegistry[section.kind];
        return <Block key={section.id} state={state} style={cfg} invitationId={invitationId} />;
      })}

      {/* Music indicator */}
      {musicSettings.enabled && (
        <div
          className="fixed bottom-4 right-4 p-2 rounded-full shadow-lg"
          style={{ background: cfg.isDark ? '#2a2a2a' : 'white' }}
        >
          <Music className="h-4 w-4" style={{ color: cfg.text }} />
        </div>
      )}

      {/* Footer */}
      <div className="h-px mx-8 mb-6" style={{ background: cfg.divider }} />
      <p className="text-center text-[10px] pb-8" style={{ color: cfg.text, opacity: 0.3 }}>WedInvite로 만들었어요</p>
    </div>
  );
}
