'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Line as KonvaLine, Rect as KonvaRect, Path as KonvaPath, Transformer } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import { textFontFamilyMap, type FreeElement } from '@/lib/types';

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

// x/y are % of canvasHeight/canvasWidth (dynamic content size); width/height are both
// % of canvasWidth so elements keep a stable scale even as page content height changes.
function ElementNode({
  element, canvasWidth, canvasHeight, interactive, onSelect, onChange, onDragStart, onDragMove, computeDragBound, onDragSettle, registerRef,
}: {
  element: FreeElement;
  canvasWidth: number;
  canvasHeight: number;
  interactive: boolean;
  onSelect: (opts?: { shift?: boolean }) => void;
  onChange: (updates: Partial<FreeElement>) => void;
  onDragStart: (node: Konva.Node) => void;
  onDragMove: (node: Konva.Node) => void;
  computeDragBound: (pos: { x: number; y: number }, pw: number, ph: number) => { x: number; y: number };
  onDragSettle: () => void;
  registerRef: (node: Konva.Node | null) => void;
}) {
  const [image] = useImage(element.src ?? '', 'anonymous');
  const px = (element.x / 100) * canvasWidth;
  const py = (element.y / 100) * canvasHeight;
  const pw = (element.width / 100) * canvasWidth;
  const ph = (element.height / 100) * canvasWidth;

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

export function FreeElementCanvas({
  elements, canvasWidth, canvasHeight, interactive, selectedIds, onSelect, onChange,
  handleColor = '#4F46E5',
}: FreeElementCanvasProps) {
  const trRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef<Record<string, Konva.Node>>({});
  const groupDragOrigin = useRef<GroupDragOrigin | null>(null);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null });

  useEffect(() => {
    if (!trRef.current) return;
    // Locked elements get no resize/rotate handles at all, not just no drag —
    // otherwise "locked" would only stop moving, not resizing/rotating. With
    // multiple nodes attached, Konva's Transformer natively scales/rotates all
    // of them together as one group — that's what makes group-resize work.
    const nodes = selectedIds
      .map((id) => {
        const el = elements.find((e) => e.id === id);
        return el && !el.locked ? nodeRefs.current[id] : undefined;
      })
      .filter((n): n is Konva.Node => !!n);
    trRef.current.nodes(nodes);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedIds, elements]);

  if (canvasWidth === 0 || canvasHeight === 0) return null;

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

  // Snaps the dragged element's center to the canvas horizontal center or to another
  // element's center (x and y independently) and surfaces which guide line(s) to draw.
  // Called from dragBoundFunc, so the returned position IS what Konva applies — see the
  // comment at the call site for why this can't be done from an onDragMove handler.
  const computeDragBound = (draggedId: string, pos: { x: number; y: number }, pw: number, ph: number) => {
    const centerX = pos.x + pw / 2;
    const centerY = pos.y + ph / 2;

    const xTargets = [canvasWidth / 2];
    const yTargets: number[] = [];
    for (const el of visibleElements) {
      if (el.id === draggedId) continue;
      const ew = (el.width / 100) * canvasWidth;
      const eh = (el.height / 100) * canvasWidth;
      xTargets.push((el.x / 100) * canvasWidth + ew / 2);
      yTargets.push((el.y / 100) * canvasHeight + eh / 2);
    }

    const snappedX = xTargets.find((t) => Math.abs(centerX - t) < SNAP_THRESHOLD) ?? null;
    const snappedY = yTargets.find((t) => Math.abs(centerY - t) < SNAP_THRESHOLD) ?? null;

    setGuides({ v: snappedX, h: snappedY });

    return {
      x: snappedX !== null ? snappedX - pw / 2 : pos.x,
      y: snappedY !== null ? snappedY - ph / 2 : pos.y,
    };
  };

  const clearGuides = () => setGuides({ v: null, h: null });

  return (
    <Stage
      width={canvasWidth}
      height={canvasHeight}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: interactive ? 'auto' : 'none' }}
      onMouseDown={(e) => { if (e.target === e.target.getStage()) onSelect(null); }}
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
            onSelect={(opts) => onSelect(el.id, opts)}
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
  );
}
