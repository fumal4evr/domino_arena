'use client';

import React, { useRef, useEffect } from 'react';
import { TurnAction, isPassMove } from '@/engine/types';

interface GameLogProps {
  history: TurnAction[];
}

const POSITION_NAMES: Record<string, string> = {
  south: 'You',
  north: 'Partner',
  east: 'East',
  west: 'West',
};

export default function GameLog({ history }: GameLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  const recentHistory = history.slice(-12);

  return (
    <div className="bg-black/30 rounded-lg p-3 min-w-48">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
        Game Log
      </div>
      <div
        ref={scrollRef}
        className="space-y-1 max-h-40 overflow-y-auto text-xs"
      >
        {recentHistory.length === 0 && (
          <div className="text-gray-500 italic">No moves yet</div>
        )}
        {recentHistory.map((action, idx) => {
          const name = POSITION_NAMES[action.playerPosition];
          if (isPassMove(action)) {
            return (
              <div key={idx} className="text-orange-400">
                {name} passed ✋
              </div>
            );
          }
          return (
            <div key={idx} className="text-gray-300">
              <span className="font-medium">{name}</span>{' '}
              played{' '}
              <span className="font-mono text-yellow-200">
                [{action.tile.left}|{action.tile.right}]
              </span>{' '}
              on {action.end}
            </div>
          );
        })}
      </div>
    </div>
  );
}
