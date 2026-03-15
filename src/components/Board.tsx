'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { BoardState, BoardEnd } from '@/engine/types';
import Tile from './Tile';
import { isDouble } from '@/engine/tile';
import { LastMoveInfo } from '@/hooks/useGame';

interface BoardProps {
  board: BoardState;
  showEndButtons: boolean;
  validEnds: BoardEnd[];
  onEndClick: (end: BoardEnd) => void;
  lastMove: LastMoveInfo | null;
  hiddenTileId: string | null;
}

export interface BoardHandle {
  getLeftEndRef: () => HTMLDivElement | null;
  getRightEndRef: () => HTMLDivElement | null;
}

const Board = forwardRef<BoardHandle, BoardProps>(function Board({
  board,
  showEndButtons,
  validEnds,
  onEndClick,
  lastMove,
  hiddenTileId,
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chainRef = useRef<HTMLDivElement>(null);
  const leftEndRef = useRef<HTMLDivElement>(null);
  const rightEndRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [chainNaturalW, setChainNaturalW] = useState(0);
  const [chainNaturalH, setChainNaturalH] = useState(0);

  useImperativeHandle(ref, () => ({
    getLeftEndRef: () => leftEndRef.current,
    getRightEndRef: () => rightEndRef.current,
  }));

  const recalcScale = useCallback(() => {
    if (!containerRef.current || !chainRef.current) return;
    const containerW = containerRef.current.clientWidth;
    const naturalW = chainRef.current.scrollWidth;
    const naturalH = chainRef.current.scrollHeight;
    setChainNaturalW(naturalW);
    setChainNaturalH(naturalH);
    if (naturalW > containerW && containerW > 0) {
      setScale(Math.max(0.3, containerW / naturalW));
    } else {
      setScale(1);
    }
  }, []);

  // Recalc when chain length changes
  useEffect(() => {
    recalcScale();
  }, [board.chain.length, recalcScale]);

  // Recalc on window resize
  useEffect(() => {
    window.addEventListener('resize', recalcScale);
    return () => window.removeEventListener('resize', recalcScale);
  }, [recalcScale]);

  if (board.chain.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-lg italic">
          Waiting for first tile...
        </div>
      </div>
    );
  }

  const lastIdx = board.chain.length - 1;

  return (
    <div ref={containerRef} className="flex items-center justify-center h-full relative overflow-hidden">
      {showEndButtons && validEnds.includes('left') && (
        <button
          onClick={() => onEndClick('left')}
          className="absolute left-2 z-10 bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-3 rounded-lg shadow-lg transition-colors text-sm"
        >
          ◀ Play Left
        </button>
      )}

      {/* Wrapper sized to the scaled chain so layout respects the visual size */}
      <div
        style={{
          width: chainNaturalW > 0 ? chainNaturalW * scale : undefined,
          height: chainNaturalH > 0 ? chainNaturalH * scale : undefined,
          flexShrink: 0,
        }}
      >
        <div
          ref={chainRef}
          className="board-chain"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'left center',
            transition: 'transform 0.3s ease',
          }}
        >
          {board.chain.map((played, idx) => {
            const isHidden = played.tile.id === hiddenTileId;
            const isLastPlayed = lastMove && played.tile.id === lastMove.tileId;
            const key = isLastPlayed
              ? `${played.tile.id}-${lastMove.timestamp}`
              : played.tile.id;
            const tileRef = idx === 0 ? leftEndRef : idx === lastIdx ? rightEndRef : undefined;
            return (
              <div
                key={key}
                ref={tileRef}
                className={`flex-shrink-0 ${isHidden ? '' : isLastPlayed ? 'tile-pop' : ''}`}
                style={isHidden ? { opacity: 0 } : undefined}
              >
                <Tile
                  tile={played.tile}
                  horizontal={!isDouble(played.tile)}
                  reversed={played.reversed}
                  played
                  size="md"
                />
              </div>
            );
          })}
        </div>
      </div>

      {showEndButtons && validEnds.includes('right') && (
        <button
          onClick={() => onEndClick('right')}
          className="absolute right-2 z-10 bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-3 rounded-lg shadow-lg transition-colors text-sm"
        >
          Play Right ▶
        </button>
      )}
    </div>
  );
});

export default Board;
