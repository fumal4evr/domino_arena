'use client';

import React from 'react';
import { Tile as TileType, PipValue } from '@/engine/types';

interface TileProps {
  tile: TileType;
  faceDown?: boolean;
  selected?: boolean;
  playable?: boolean;
  validTarget?: boolean;
  played?: boolean;
  horizontal?: boolean;
  reversed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: { w: 24, h: 48, pip: 4, gap: 1 },
  md: { w: 36, h: 72, pip: 5, gap: 2 },
  lg: { w: 48, h: 96, pip: 6, gap: 2 },
};

/** Pip positions within a half-tile (relative %, centered in the half).
 *  Defined for a vertical (portrait) half-tile. For horizontal half-tiles
 *  the caller should swap x↔y so the pattern rotates with the tile. */
function getPipPositions(
  value: PipValue,
  rotated = false,
): { x: number; y: number }[] {
  const positions: Record<number, { x: number; y: number }[]> = {
    0: [],
    1: [{ x: 50, y: 50 }],
    2: [
      { x: 25, y: 25 },
      { x: 75, y: 75 },
    ],
    3: [
      { x: 25, y: 25 },
      { x: 50, y: 50 },
      { x: 75, y: 75 },
    ],
    4: [
      { x: 25, y: 25 },
      { x: 75, y: 25 },
      { x: 25, y: 75 },
      { x: 75, y: 75 },
    ],
    5: [
      { x: 25, y: 25 },
      { x: 75, y: 25 },
      { x: 50, y: 50 },
      { x: 25, y: 75 },
      { x: 75, y: 75 },
    ],
    6: [
      { x: 25, y: 20 },
      { x: 75, y: 20 },
      { x: 25, y: 50 },
      { x: 75, y: 50 },
      { x: 25, y: 80 },
      { x: 75, y: 80 },
    ],
  };
  const pts = positions[value] || [];
  if (rotated) {
    return pts.map((p) => ({ x: p.y, y: p.x }));
  }
  return pts;
}

function PipDots({
  value,
  halfWidth,
  halfHeight,
  pipSize,
  offsetX,
  offsetY,
  rotated = false,
}: {
  value: PipValue;
  halfWidth: number;
  halfHeight: number;
  pipSize: number;
  offsetX: number;
  offsetY: number;
  rotated?: boolean;
}) {
  const pips = getPipPositions(value, rotated);
  return (
    <>
      {pips.map((p, i) => (
        <div
          key={i}
          className="pip"
          style={{
            width: pipSize,
            height: pipSize,
            left: offsetX + (p.x / 100) * halfWidth - pipSize / 2,
            top: offsetY + (p.y / 100) * halfHeight - pipSize / 2,
          }}
        />
      ))}
    </>
  );
}

export default function Tile({
  tile,
  faceDown = false,
  selected = false,
  playable = false,
  validTarget = false,
  played = false,
  horizontal = false,
  reversed = false,
  size = 'md',
  onClick,
}: TileProps) {
  const s = SIZE_MAP[size];
  const w = horizontal ? s.h : s.w;
  const h = horizontal ? s.w : s.h;

  const classNames = [
    'domino-tile',
    faceDown ? 'face-down' : '',
    selected ? 'selected' : '',
    playable ? 'playable' : '',
    validTarget ? 'valid-target' : '',
    played ? 'played' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (faceDown) {
    return (
      <div
        className={classNames}
        style={{ width: w, height: h, display: 'inline-block' }}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background:
              'repeating-linear-gradient(45deg, #3a3a8a, #3a3a8a 3px, #4a4a9a 3px, #4a4a9a 6px)',
            borderRadius: 4,
          }}
        />
      </div>
    );
  }

  // When reversed, swap the two halves so the connecting side faces the chain
  const firstValue = reversed ? tile.right : tile.left;
  const secondValue = reversed ? tile.left : tile.right;

  if (horizontal) {
    const halfW = w / 2;
    return (
      <div
        className={classNames}
        style={{ width: w, height: h, display: 'inline-block' }}
        onClick={onClick}
      >
        <PipDots
          value={firstValue}
          halfWidth={halfW - 2}
          halfHeight={h - 4}
          pipSize={s.pip}
          offsetX={2}
          offsetY={2}
          rotated
        />
        {/* Divider line */}
        <div
          style={{
            position: 'absolute',
            left: halfW - 0.5,
            top: 4,
            bottom: 4,
            width: 1,
            background: '#999',
          }}
        />
        <PipDots
          value={secondValue}
          halfWidth={halfW - 2}
          halfHeight={h - 4}
          pipSize={s.pip}
          offsetX={halfW}
          offsetY={2}
          rotated
        />
      </div>
    );
  }

  const halfH = h / 2;
  return (
    <div
      className={classNames}
      style={{ width: w, height: h, display: 'inline-block' }}
      onClick={onClick}
    >
      <PipDots
        value={firstValue}
        halfWidth={w - 4}
        halfHeight={halfH - 2}
        pipSize={s.pip}
        offsetX={2}
        offsetY={2}
      />
      {/* Divider line */}
      <div
        style={{
          position: 'absolute',
          left: 4,
          right: 4,
          top: halfH - 0.5,
          height: 1,
          background: '#999',
        }}
      />
      <PipDots
        value={secondValue}
        halfWidth={w - 4}
        halfHeight={halfH - 2}
        pipSize={s.pip}
        offsetX={2}
        offsetY={halfH}
      />
    </div>
  );
}
