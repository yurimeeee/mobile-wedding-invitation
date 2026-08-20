'use client';

import type { CSSProperties } from 'react';

// Hand-picked (not random) so server and client render the same markup on first paint.
const PETALS: { left: number; size: number; duration: number; delay: number; drift: number }[] = [
  { left: 6, size: 14, duration: 7.5, delay: 0, drift: 26 },
  { left: 18, size: 10, duration: 6.2, delay: 1.4, drift: -18 },
  { left: 30, size: 16, duration: 8.4, delay: 0.6, drift: 20 },
  { left: 42, size: 11, duration: 6.8, delay: 2.6, drift: -22 },
  { left: 54, size: 13, duration: 7.8, delay: 1.1, drift: 24 },
  { left: 66, size: 9, duration: 6.5, delay: 3.2, drift: -16 },
  { left: 76, size: 15, duration: 8.1, delay: 0.2, drift: 18 },
  { left: 86, size: 12, duration: 7.1, delay: 2.1, drift: -24 },
  { left: 94, size: 10, duration: 6.9, delay: 3.8, drift: 20 },
  { left: 12, size: 12, duration: 8.6, delay: 4.4, drift: -20 },
];

type PetalStyle = CSSProperties & { '--petal-drift'?: string };

export function PetalOverlay({ color }: { color: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PETALS.map((p, i) => {
        const style: PetalStyle = {
          left: `${p.left}%`,
          top: 0,
          width: p.size,
          height: p.size * 1.25,
          animation: `petal-fall ${p.duration}s ease-in ${p.delay}s infinite`,
          '--petal-drift': `${p.drift}px`,
        };
        return (
          <div key={i} className="absolute" style={style}>
            <svg viewBox="0 0 16 20" width="100%" height="100%">
              <path
                d="M8 0C8 0 16 6 16 12C16 16.4 12.4 20 8 20C3.6 20 0 16.4 0 12C0 6 8 0 8 0Z"
                fill={color}
                opacity={0.55}
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
