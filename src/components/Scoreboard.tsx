
import React from 'react';
import { Team } from '@/engine/types';

interface ScoreboardProps {
  teams: [Team, Team];
  round: number;
}

export default function Scoreboard({ teams, round }: ScoreboardProps) {
  return (
    <div className="bg-black/30 rounded-lg p-3 text-center min-w-48">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
        Round {round}
      </div>
      <div className="space-y-2">
        {teams.map((team) => (
          <div
            key={team.name}
            className="flex justify-between items-center gap-4"
          >
            <span className="text-sm font-medium">{team.name}</span>
            <span className="text-xl font-bold text-yellow-300">
              {team.score}
            </span>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-2">First to 100 loses</div>
    </div>
  );
}
