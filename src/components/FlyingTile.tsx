'use client';

import React, { useEffect, useState, useRef } from 'react';
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

  useEffect(() => {
    if (hasAnimated.current) return;
    const from = fromRef.current;
    const to = getToElement();
    if (!from || !to) {
      onComplete();
      return;
    }

    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();

    const startX = fromRect.left + fromRect.width / 2 - 36;
    const startY = fromRect.top + fromRect.height / 2 - 18;
    const endX = toRect.left + toRect.width / 2 - 36;
    const endY = toRect.top + toRect.height / 2 - 18;

    // Start tile at 1.5x scale so it's very visible during flight
    setStyle({
      position: 'fixed',
      zIndex: 100,
      pointerEvents: 'none',
      left: startX,
      top: startY,
      opacity: 1,
      transform: 'scale(1.5)',
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
          transform: 'scale(1)',
          transition: `left ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), top ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), filter ${duration}ms ease-out`,
          filter: 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.4))',
        });
      });
    });

    const timer = setTimeout(onComplete, duration + 50);
    return () => clearTimeout(timer);
  }, [fromRef, getToElement, duration, onComplete]);

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
