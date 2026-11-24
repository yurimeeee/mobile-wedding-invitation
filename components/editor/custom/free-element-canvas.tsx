'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Line as KonvaLine, Rect as KonvaRect, Path as KonvaPath, Transformer } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import { textFontFamilyMap, type FreeElement } from '@/lib/types';

// x/y are % of canvasHeight/canvasWidth (dynamic content size); width/height are both
// % of canvasWidth so elements keep a stable scale even as page content height changes.
// Shared by ElementNode's own render and the inline-text-edit overlay so the HTML
// textarea lines up exactly with the Konva node it's standing in for.
function elementBoxPx(el: FreeElement, canvasWidth: number, canvasHeight: number) {
  return {
    px: (el.x / 100) * canvasWidth,
    py: (el.y / 100) * canvasHeight,
    pw: (el.width / 100) * canvasWidth,
    ph: (el.height / 100) * canvasWidth,
  };
}

// Cubic-bezier heart, sized directly to the given box so no extra node-level
// scale is needed (keeps it compatible with the generic drag/transform math below).
function heartPathData(w: number, h: number): string {
  const x = w / 2;
  return `M ${x} ${h * 0.3}
    C ${x} ${h * 0.1}, ${w * 0.2} 0, ${w * 0.2} ${h * 0.25}
    C ${w * 0.2} ${h * 0.45}, ${x} ${h * 0.6}, ${x} ${h}
    C ${x} ${h * 0.6}, ${w * 0.8} ${h * 0.45}, ${w * 0.8} ${h * 0.25}
    C ${w * 0.8} 0, ${x} ${h * 0.1}, ${x} ${h * 0.3} Z`;
}

interface FreeElementCanvasProps {
  elements: FreeElement[];
  canvasWidth: number;
  canvasHeight: number;
  interactive: boolean;
  selectedIds: string[];
  onSelect: (id: string | null, opts?: { shift?: boolean }) => void;
  onChange: (id: string, updates: Partial<FreeElement>) => void;
  /** Resize/rotate handle color — defaults to the current template's accent color. */
  handleColor?: string;
}

function ElementNode({
  element, canvasWidth, canvasHeight, interactive, isEditing, onSelect, onStartEditing, onChange, onDragStart, onDragMove, computeDragBound, onDragSettle, registerRef,
}: {
  element: FreeElement;
  canvasWidth: number;
  canvasHeight: number;
  interactive: boolean;
  isEditing: boolean;
  onSelect: (opts?: { shift?: boolean }) => void;
  onStartEditing: () => void;
  onChange: (updates: Partial<FreeElement>) => void;
  onDragStart: (node: Konva.Node) => void;
  onDragMove: (node: Konva.Node) => void;
  computeDragBound: (pos: { x: number; y: number }, pw: number, ph: number) => { x: number; y: number };
  onDragSettle: () => void;
  registerRef: (node: Konva.Node | null) => void;
}) {
  // crossOrigin 없이 로드한다 — 캔버스를 이미지로 내보내는 기능이 없어 tainted canvas
  // 제약이 문제 되지 않는 반면, 'anonymous'로 로드하면 Storage 버킷에 CORS 헤더가 없을 때
  // (Firebase Storage 기본값) 브라우저가 렌더링 자체를 거부해 요소가 아예 안 보이게 된다.
  const [image] = useImage(element.src ?? '');
  const { px, py, pw, ph } = elementBoxPx(element, canvasWidth, canvasHeight);

  // While the HTML textarea overlay is editing this text element, hide the Konva
  // node underneath it instead of rendering both on top of each other.
  if (element.type === 'text' && isEditing) return null;

  // Border reuses Konva's stroke/strokeWidth, which the 'line' shape already uses for
  // its own color — a second stroke there would just overwrite it, so line skips this.
  const borderProps = element.borderEnabled && !(element.type === 'shape' && element.shapeKind === 'line')
    ? { stroke: element.borderColor ?? '#000000', strokeWidth: ((element.borderWidth ?? 1) / 100) * canvasWidth }
    : {};

  const commonProps = {
    ref: registerRef,
    x: px,
    y: py,
    width: pw,
    height: ph,
    rotation: element.rotation,
    opacity: element.opacity,
    draggable: interactive && !element.locked,
    listening: interactive,
    ...(element.shadow ? {
      shadowColor: '#000000',
      shadowBlur: 12,
      shadowOffsetX: 0,
      shadowOffsetY: 4,
      shadowOpacity: 0.3,
    } : {}),
    ...borderProps,
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => { e.cancelBubble = true; onSelect({ shift: e.evt.shiftKey }); },
    onTap: (e: Konva.KonvaEventObject<Event>) => { e.cancelBubble = true; onSelect(); },
    // Double-click/tap a text element to edit it in place, same as Miricanvas —
    // other element types ignore this (they're only edited via the side panel).
    onDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (element.type === 'text') onStartEditing();
    },
    onDblTap: (e: Konva.KonvaEventObject<Event>) => {
      e.cancelBubble = true;
      if (element.type === 'text') onStartEditing();
    },
    // dragBoundFunc is Konva's sanctioned interception point for constraining/snapping
    // drag position — mutating node.x()/y() from an onDragMove handler instead gets
    // fought and overwritten by Konva's own pointer-delta tracking on the very next
    // move event, so the snap never visibly sticks.
    dragBoundFunc: (pos: { x: number; y: number }) => (interactive ? computeDragBound(pos, pw, ph) : pos),
    onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => onDragStart(e.target),
    // Separate from dragBoundFunc: this fires after Konva has already applied the
    // (possibly snapped) position, so it's the right place to drag grouped siblings
    // along by the same delta without fighting the snap logic above.
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => onDragMove(e.target),
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      onChange({
        x: (e.target.x() / canvasWidth) * 100,
        y: (e.target.y() / canvasHeight) * 100,
      });
      onDragSettle();
    },
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      onChange({
        x: (node.x() / canvasWidth) * 100,
        y: (node.y() / canvasHeight) * 100,
        width: ((node.width() * scaleX) / canvasWidth) * 100,
        height: ((node.height() * scaleY) / canvasWidth) * 100,
        rotation: node.rotation(),
      });
    },
  };

  if (element.type === 'text') {
    const fontSizePct = element.fontSize ?? Math.max(12, ph * 0.4) / canvasWidth * 100;
    const fontStyle = [element.bold && 'bold', element.italic && 'italic'].filter(Boolean).join(' ') || 'normal';
    return (
      <KonvaText
        {...commonProps}
        text={element.text || '텍스트'}
        fontSize={(fontSizePct / 100) * canvasWidth}
        fontFamily={textFontFamilyMap[element.fontFamily ?? 'sans']}
        fontStyle={fontStyle}
        fill={element.color ?? '#333333'}
        align={element.align ?? 'center'}
        verticalAlign="middle"
        letterSpacing={((element.letterSpacing ?? 0) / 100) * canvasWidth}
        lineHeight={element.lineHeight ?? 1}
      />
    );
  }

  if (element.type === 'shape') {
    const color = element.color ?? '#8B6F47';
    if (element.shapeKind === 'line') {
      return (
        <KonvaLine
          {...commonProps}
          points={[0, ph / 2, pw, ph / 2]}
          stroke={color}
          strokeWidth={Math.max(1, ph)}
          lineCap="round"
        />
      );
    }
    if (element.shapeKind === 'heart') {
      return <KonvaPath {...commonProps} data={heartPathData(pw, ph)} fill={color} />;
    }
    // 'circle' uses a fully-rounded Rect instead of Konva's Circle — Circle's x/y is
    // its center, not top-left, which would break the shared top-left-anchored drag/
    // transform math every other element type relies on.
    const cornerRadius = element.shapeKind === 'circle' ? Math.min(pw, ph) / 2 : Math.min(pw, ph) * 0.08;
    return <KonvaRect {...commonProps} fill={color} cornerRadius={cornerRadius} />;
  }

  if (!image) return null;
  return <KonvaImage {...commonProps} image={image} />;
}

const SNAP_THRESHOLD = 6; // px
const GUIDE_COLOR = '#F43F5E';

interface GroupDragOrigin {
  id: string;
  start: { x: number; y: number };
  siblings: { id: string; node: Konva.Node; startX: number; startY: number }[];
}

interface MarqueeBox { x: number; y: number; w: number; h: number }

export function FreeElementCanvas({
  elements, canvasWidth, canvasHeight, interactive, selectedIds, onSelect, onChange,
  handleColor = '#4F46E5',
}: FreeElementCanvasProps) {
  const trRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef<Record<string, Konva.Node>>({});
  const groupDragOrigin = useRef<GroupDragOrigin | null>(null);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Drag-to-select (marquee): mousedown on empty canvas starts tracking a box;
  // whether it was actually dragged (vs. a plain click-to-deselect) is only known
  // at mouseup, so the drag distance check lives in a ref rather than state.
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);
  const [marquee, setMarquee] = useState<MarqueeBox | null>(null);

  useEffect(() => {
    if (!trRef.current) return;
    // Locked elements get no resize/rotate handles at all, not just no drag —
    // otherwise "locked" would only stop moving, not resizing/rotating. With
    // multiple nodes attached, Konva's Transformer natively scales/rotates all
    // of them together as one group — that's what makes group-resize work.
    // The element currently being inline-edited is excluded too: its Konva node
    // is unmounted (ElementNode returns null for it) while the textarea overlay
    // is open, so attaching it here would hand the Transformer a stale node.
    const nodes = selectedIds
      .map((id) => {
        if (id === editingId) return undefined;
        const el = elements.find((e) => e.id === id);
        return el && !el.locked ? nodeRefs.current[id] : undefined;
      })
      .filter((n): n is Konva.Node => !!n);
    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedIds, elements, editingId]);

  const visibleElements = elements.filter((el) => el.visible !== false);
  const sorted = [...visibleElements].sort((a, b) => a.zIndex - b.zIndex);

  // Plain shape drags aren't synced across Konva nodes the way multi-node Transformer
  // resize/rotate is, so grouped siblings need to be moved by hand: record everyone's
  // starting position on dragstart, then re-apply the leader's delta on every move.
  const handleGroupDragStart = (draggedId: string, node: Konva.Node) => {
    const el = visibleElements.find((e) => e.id === draggedId);
    if (!el?.groupId) {
      groupDragOrigin.current = null;
      return;
    }
    const siblings = visibleElements
      .filter((e) => e.groupId === el.groupId && e.id !== draggedId)
      .map((e) => {
        const sNode = nodeRefs.current[e.id];
        return sNode ? { id: e.id, node: sNode, startX: sNode.x(), startY: sNode.y() } : null;
      })
      .filter((s): s is { id: string; node: Konva.Node; startX: number; startY: number } => s !== null);
    groupDragOrigin.current = { id: draggedId, start: { x: node.x(), y: node.y() }, siblings };
  };

  const handleGroupDragMove = (draggedId: string, node: Konva.Node) => {
    const origin = groupDragOrigin.current;
    if (!origin || origin.id !== draggedId || origin.siblings.length === 0) return;
    const deltaX = node.x() - origin.start.x;
    const deltaY = node.y() - origin.start.y;
    origin.siblings.forEach((s) => {
      s.node.x(s.startX + deltaX);
      s.node.y(s.startY + deltaY);
    });
    node.getLayer()?.batchDraw();
  };

  const handleGroupDragEnd = (draggedId: string) => {
    const origin = groupDragOrigin.current;
    if (origin && origin.id === draggedId) {
      origin.siblings.forEach((s) => {
        onChange(s.id, {
          x: (s.node.x() / canvasWidth) * 100,
          y: (s.node.y() / canvasHeight) * 100,
        });
      });
    }
    groupDragOrigin.current = null;
  };

  // Snaps the dragged element's left/center/right edge (and top/center/bottom for
  // y) to the matching edge of the canvas or of another element, picking whichever
  // single candidate is closest per axis, and surfaces which guide line to draw.
  // Called from dragBoundFunc, so the returned position IS what Konva applies — see
  // the comment at the call site for why this can't be done from an onDragMove handler.
  const computeDragBound = (draggedId: string, pos: { x: number; y: number }, pw: number, ph: number) => {
    const xTargets: number[] = [0, canvasWidth / 2, canvasWidth];
    const yTargets: number[] = [0, canvasHeight / 2, canvasHeight];
    for (const el of visibleElements) {
      if (el.id === draggedId) continue;
      const { px: ex, py: ey, pw: ew, ph: eh } = elementBoxPx(el, canvasWidth, canvasHeight);
      xTargets.push(ex, ex + ew / 2, ex + ew);
      yTargets.push(ey, ey + eh / 2, ey + eh);
    }

    // Tests the dragged element's start/center/end edge against every candidate
    // target and keeps only the closest match (if any is within threshold), so a
    // drag never snaps two different edges to two different targets at once.
    const snapAxis = (start: number, size: number, targets: number[]) => {
      let best: { diff: number; offset: number; guide: number } | null = null;
      for (const edgePos of [start, start + size / 2, start + size]) {
        for (const t of targets) {
          const diff = Math.abs(edgePos - t);
          if (diff < SNAP_THRESHOLD && (!best || diff < best.diff)) {
            best = { diff, offset: t - edgePos, guide: t };
          }
        }
      }
      return best;
    };

    const snapX = snapAxis(pos.x, pw, xTargets);
    const snapY = snapAxis(pos.y, ph, yTargets);

    setGuides({ v: snapX ? snapX.guide : null, h: snapY ? snapY.guide : null });

    return {
      x: snapX ? pos.x + snapX.offset : pos.x,
      y: snapY ? pos.y + snapY.offset : pos.y,
    };
  };

  const clearGuides = () => setGuides({ v: null, h: null });

  const finishMarquee = () => {
    const box = marquee;
    marqueeStart.current = null;
    setMarquee(null);
    if (!didDrag.current) return;
    didDrag.current = false;
    if (!box || box.w < 2 || box.h < 2) return;

    const hits = visibleElements.filter((el) => {
      const { px, py, pw, ph } = elementBoxPx(el, canvasWidth, canvasHeight);
      return px < box.x + box.w && px + pw > box.x && py < box.y + box.h && py + ph > box.y;
    });
    if (hits.length === 0) return;
    // First hit replaces the selection, the rest are added with the same
    // "shift" path onSelect already uses — this also expands each hit to its
    // whole group, same as a normal click would.
    hits.forEach((el, i) => onSelect(el.id, i === 0 ? undefined : { shift: true }));
  };

  // Safety net: finish the marquee even if the mouse is released outside the
  // Stage (dragged past the canvas edge), since Konva's own onMouseUp only
  // fires for pointers still over it.
  useEffect(() => {
    const handler = () => { if (marqueeStart.current) finishMarquee(); };
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  });

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target !== e.target.getStage()) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    marqueeStart.current = pos;
    didDrag.current = false;
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const start = marqueeStart.current;
    if (!start) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    const dx = pos.x - start.x;
    const dy = pos.y - start.y;
    if (!didDrag.current && Math.hypot(dx, dy) < 4) return;
    didDrag.current = true;
    setMarquee({ x: Math.min(start.x, pos.x), y: Math.min(start.y, pos.y), w: Math.abs(dx), h: Math.abs(dy) });
  };

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!marqueeStart.current) return;
    if (!didDrag.current && e.target === e.target.getStage()) onSelect(null);
    finishMarquee();
  };

  const editingElement = editingId ? elements.find((el) => el.id === editingId) : null;
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus + select-all only when switching which element is being edited, not
  // on every re-render — a ref callback re-invoked on each render would instead
  // re-select the text under the user mid-keystroke.
  useEffect(() => {
    if (editingId) editTextareaRef.current?.select();
  }, [editingId]);

  // Deferred past every hook above (not an early `return` right after the
  // Transformer-sync effect) so hook call order/count stays identical across
  // renders even while canvasWidth/canvasHeight are still 0 (before the
  // ResizeObserver in the parent has measured anything).
  if (canvasWidth === 0 || canvasHeight === 0) return null;

  return (
    <>
    <Stage
      width={canvasWidth}
      height={canvasHeight}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: interactive ? 'auto' : 'none' }}
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      onTouchStart={(e) => { if (e.target === e.target.getStage()) onSelect(null); }}
    >
      <Layer>
        {sorted.map((el) => (
          <ElementNode
            key={el.id}
            element={el}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            interactive={interactive}
            isEditing={el.id === editingId}
            onSelect={(opts) => onSelect(el.id, opts)}
            onStartEditing={() => setEditingId(el.id)}
            onChange={(updates) => onChange(el.id, updates)}
            onDragStart={(node) => handleGroupDragStart(el.id, node)}
            onDragMove={(node) => handleGroupDragMove(el.id, node)}
            computeDragBound={(pos, pw, ph) => computeDragBound(el.id, pos, pw, ph)}
            onDragSettle={() => { clearGuides(); handleGroupDragEnd(el.id); }}
            registerRef={(node) => {
              if (node) nodeRefs.current[el.id] = node;
              else delete nodeRefs.current[el.id];
            }}
          />
        ))}
        {guides.v !== null && (
          <KonvaLine points={[guides.v, 0, guides.v, canvasHeight]} stroke={GUIDE_COLOR} strokeWidth={1} dash={[4, 4]} listening={false} />
        )}
        {guides.h !== null && (
          <KonvaLine points={[0, guides.h, canvasWidth, guides.h]} stroke={GUIDE_COLOR} strokeWidth={1} dash={[4, 4]} listening={false} />
        )}
        {marquee && (
          <KonvaRect
            x={marquee.x}
            y={marquee.y}
            width={marquee.w}
            height={marquee.h}
            fill="rgba(79,70,229,0.08)"
            stroke={handleColor}
            strokeWidth={1}
            listening={false}
          />
        )}
        {interactive && (
          <Transformer
            ref={trRef}
            rotateEnabled
            keepRatio={false}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            anchorSize={14}
            anchorCornerRadius={4}
            anchorFill="#FFFFFF"
            anchorStroke={handleColor}
            anchorStrokeWidth={1.5}
            borderStroke={handleColor}
            borderStrokeWidth={1.5}
            rotateAnchorOffset={22}
          />
        )}
      </Layer>
    </Stage>
    {editingElement && (() => {
      const { px, py, pw, ph } = elementBoxPx(editingElement, canvasWidth, canvasHeight);
      const fontSizePct = editingElement.fontSize ?? (Math.max(12, ph * 0.4) / canvasWidth) * 100;
      return (
        <textarea
          key={editingElement.id}
          ref={editTextareaRef}
          defaultValue={editingElement.text ?? ''}
          onBlur={(e) => { onChange(editingElement.id, { text: e.target.value }); setEditingId(null); }}
          onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); }}
          style={{
            position: 'absolute',
            left: px,
            top: py,
            width: pw,
            height: ph,
            transform: `rotate(${editingElement.rotation}deg)`,
            transformOrigin: 'top left',
            fontSize: (fontSizePct / 100) * canvasWidth,
            fontFamily: textFontFamilyMap[editingElement.fontFamily ?? 'sans'],
            fontWeight: editingElement.bold ? 'bold' : 'normal',
            fontStyle: editingElement.italic ? 'italic' : 'normal',
            textAlign: editingElement.align ?? 'center',
            color: editingElement.color ?? '#333333',
            letterSpacing: ((editingElement.letterSpacing ?? 0) / 100) * canvasWidth,
            lineHeight: editingElement.lineHeight ?? 1,
            // Approximates the Konva glyph-stroke outline (strokeText) while editing —
            // Chromium/Safari only, but it's just a live preview during typing, not the
            // actual render, so Firefox silently ignoring it is an acceptable gap.
            ...(editingElement.borderEnabled ? {
              WebkitTextStroke: `${((editingElement.borderWidth ?? 1) / 100) * canvasWidth}px ${editingElement.borderColor ?? '#000000'}`,
            } : {}),
            background: 'rgba(255,255,255,0.75)',
            border: `1px dashed ${handleColor}`,
            outline: 'none',
            resize: 'none',
            padding: 0,
            overflow: 'hidden',
          }}
        />
      );
    })()}
    </>
  );
}
