'use client';

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const leftEndRef = useRef<HTMLDivElement>(null);
  const rightEndRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    getLeftEndRef: () => leftEndRef.current,
    getRightEndRef: () => rightEndRef.current,
  }));

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
  }, [board.chain.length]);

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
    <div className="flex items-center justify-center h-full relative">
      {showEndButtons && validEnds.includes('left') && (
        <button
          onClick={() => onEndClick('left')}
          className="absolute left-2 z-10 bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-3 rounded-lg shadow-lg transition-colors text-sm"
        >
          ◀ Play Left
        </button>
      )}

      <div
        ref={scrollRef}
        className="overflow-x-auto max-w-full"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="board-chain">
          {board.chain.map((played, idx) => {
            const isHidden = played.tile.id === hiddenTileId;
            const isLastPlayed = lastMove && played.tile.id === lastMove.tileId;
            const key = isLastPlayed
              ? `${played.tile.id}-${lastMove.timestamp}`
              : played.tile.id;
            // Attach refs to the first and last tile wrappers
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
