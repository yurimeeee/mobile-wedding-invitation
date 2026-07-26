'use client';

import { useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type { FreeElement } from '@/lib/types';

interface FreeElementCanvasProps {
  elements: FreeElement[];
  canvasWidth: number;
  canvasHeight: number;
  interactive: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, updates: Partial<FreeElement>) => void;
  /** Resize/rotate handle color — defaults to the current template's accent color. */
  handleColor?: string;
}

// x/y are % of canvasHeight/canvasWidth (dynamic content size); width/height are both
// % of canvasWidth so elements keep a stable scale even as page content height changes.
function ElementNode({
  element, canvasWidth, canvasHeight, interactive, onSelect, onChange, registerRef,
}: {
  element: FreeElement;
  canvasWidth: number;
  canvasHeight: number;
  interactive: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<FreeElement>) => void;
  registerRef: (node: Konva.Node | null) => void;
}) {
  const [image] = useImage(element.src ?? '', 'anonymous');
  const px = (element.x / 100) * canvasWidth;
  const py = (element.y / 100) * canvasHeight;
  const pw = (element.width / 100) * canvasWidth;
  const ph = (element.height / 100) * canvasWidth;

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
    onClick: (e: Konva.KonvaEventObject<MouseEvent>) => { e.cancelBubble = true; onSelect(); },
    onTap: (e: Konva.KonvaEventObject<Event>) => { e.cancelBubble = true; onSelect(); },
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      onChange({
        x: (e.target.x() / canvasWidth) * 100,
        y: (e.target.y() / canvasHeight) * 100,
      });
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
    return (
      <KonvaText
        {...commonProps}
        text={element.text || '텍스트'}
        fontSize={Math.max(12, ph * 0.4)}
        fill="#333333"
        align="center"
        verticalAlign="middle"
      />
    );
  }

  if (!image) return null;
  return <KonvaImage {...commonProps} image={image} />;
}

export function FreeElementCanvas({
  elements, canvasWidth, canvasHeight, interactive, selectedId, onSelect, onChange,
  handleColor = '#4F46E5',
}: FreeElementCanvasProps) {
  const trRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef<Record<string, Konva.Node>>({});

  useEffect(() => {
    if (!trRef.current) return;
    const node = selectedId ? nodeRefs.current[selectedId] : null;
    trRef.current.nodes(node ? [node] : []);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedId, elements]);

  if (canvasWidth === 0 || canvasHeight === 0) return null;

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

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
            onSelect={() => onSelect(el.id)}
            onChange={(updates) => onChange(el.id, updates)}
            registerRef={(node) => {
              if (node) nodeRefs.current[el.id] = node;
              else delete nodeRefs.current[el.id];
            }}
          />
        ))}
        {interactive && (
          <Transformer
            ref={trRef}
            rotateEnabled
            keepRatio={false}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            anchorSize={10}
            anchorCornerRadius={3}
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
