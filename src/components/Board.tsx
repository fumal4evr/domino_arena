'use client';

import React, { useRef, useEffect } from 'react';
import { BoardState, BoardEnd, PlayerPosition } from '@/engine/types';
import Tile from './Tile';
import { isDouble } from '@/engine/tile';
import { LastMoveInfo } from '@/hooks/useGame';

interface BoardProps {
  board: BoardState;
  showEndButtons: boolean;
  validEnds: BoardEnd[];
  onEndClick: (end: BoardEnd) => void;
  lastMove: LastMoveInfo | null;
}

const DIRECTION_CLASS: Record<PlayerPosition, string> = {
  north: 'fly-from-north',
  south: 'fly-from-south',
  east: 'fly-from-east',
  west: 'fly-from-west',
};

export default function Board({
  board,
  showEndButtons,
  validEnds,
  onEndClick,
  lastMove,
}: BoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
            const isLastPlayed = lastMove && played.tile.id === lastMove.tileId;
            const animClass = isLastPlayed
              ? DIRECTION_CLASS[lastMove.playerPosition]
              : '';
            return (
              <div
                key={`${played.tile.id}-${lastMove?.timestamp ?? 0}`}
                className={`flex-shrink-0 ${animClass}`}
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
}
