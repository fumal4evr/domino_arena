
import React, { useLayoutEffect, useEffect, useState, useRef } from 'react';
import { Tile as TileType } from '@/engine/types';
import Tile from './Tile';
import { isDouble } from '@/engine/tile';

interface FlyingTileProps {
  tile: TileType;
  reversed: boolean;
  fromRef: React.RefObject<HTMLDivElement | null>;
  getToElement: () => HTMLDivElement | null;
  onComplete: () => void;
  duration?: number;
}

export default function FlyingTile({
  tile,
  reversed,
  fromRef,
  getToElement,
  onComplete,
  duration = 1000,
}: FlyingTileProps) {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    zIndex: 100,
    pointerEvents: 'none',
    opacity: 0,
  });
  const hasAnimated = useRef(false);
  const completeCalled = useRef(false);

  const safeComplete = () => {
    if (!completeCalled.current) {
      completeCalled.current = true;
      onComplete();
    }
  };

  // Completion timer in a separate effect so that parent re-renders (which
  // recreate the inline getToElement prop) cannot cancel it.  The component
  // is keyed per animation, so this runs exactly once per flight.
  useEffect(() => {
    const timer = setTimeout(safeComplete, duration + 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useLayoutEffect so we measure after Board's layout (useLayoutEffect) has
  // settled the chain scale — positions will already be correct.
  useLayoutEffect(() => {
    if (hasAnimated.current) return;
    const from = fromRef.current;
    const to = getToElement();
    if (!from || !to) {
      safeComplete();
      return;
    }

    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();

    // Use center points; translate(-50%,-50%) handles the offset.
    const startX = fromRect.left + fromRect.width / 2;
    const startY = fromRect.top + fromRect.height / 2;
    const endX = toRect.left + toRect.width / 2;
    const endY = toRect.top + toRect.height / 2;

    setStyle({
      position: 'fixed',
      zIndex: 100,
      pointerEvents: 'none',
      left: startX,
      top: startY,
      opacity: 1,
      transform: 'translate(-50%, -50%) scale(1.5)',
      transition: 'none',
      filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.9))',
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hasAnimated.current = true;
        setStyle({
          position: 'fixed',
          zIndex: 100,
          pointerEvents: 'none',
          left: endX,
          top: endY,
          opacity: 1,
          transform: 'translate(-50%, -50%) scale(1)',
          transition: `left ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), top ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${duration}ms ease-out`,
          filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.4))',
        });
      });
    });
  }, [fromRef, getToElement, duration]);

  return (
    <div style={style}>
      <Tile
        tile={tile}
        horizontal={!isDouble(tile)}
        reversed={reversed}
        played
        size="md"
      />
    </div>
  );
}
