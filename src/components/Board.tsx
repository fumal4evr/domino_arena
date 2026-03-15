'use client';

import React, { useRef, useEffect } from 'react';
import { BoardState, BoardEnd, PlayedTile } from '@/engine/types';
import Tile from './Tile';
import { isDouble } from '@/engine/tile';

interface BoardProps {
  board: BoardState;
  showEndButtons: boolean;
  validEnds: BoardEnd[];
  onEndClick: (end: BoardEnd) => void;
}

export default function Board({
  board,
  showEndButtons,
  validEnds,
  onEndClick,
}: BoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to center when a new tile is placed
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
      {/* Left end button */}
      {showEndButtons && validEnds.includes('left') && (
        <button
          onClick={() => onEndClick('left')}
          className="absolute left-2 z-10 bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-3 rounded-lg shadow-lg transition-colors text-sm"
        >
          ◀ Play Left
        </button>
      )}

      {/* Board tiles */}
      <div
        ref={scrollRef}
        className="overflow-x-auto max-w-full"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="board-chain">
          {board.chain.map((played, idx) => (
            <div key={idx} className="tile-enter flex-shrink-0">
              <Tile
                tile={played.tile}
                horizontal={!isDouble(played.tile)}
                reversed={played.reversed}
                played
                size="md"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right end button */}
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
