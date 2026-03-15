'use client';

import React from 'react';

interface SpeedSliderProps {
  value: number;
  onChange: (ms: number) => void;
}

const SPEED_LABELS: { ms: number; label: string }[] = [
  { ms: 500, label: '🐇' },
  { ms: 1000, label: '' },
  { ms: 1500, label: '' },
  { ms: 2000, label: '' },
  { ms: 3000, label: '🐢' },
];

export default function SpeedSlider({ value, onChange }: SpeedSliderProps) {
  return (
    <div className="bg-black/30 rounded-lg px-3 py-2 flex flex-col items-center gap-1 min-w-36">
      <div className="text-xs text-gray-400 uppercase tracking-wider">
        Speed
      </div>
      <div className="flex items-center gap-2 w-full">
        <span className="text-xs">🐇</span>
        <input
          type="range"
          min={500}
          max={3000}
          step={250}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 accent-yellow-400 cursor-pointer"
        />
        <span className="text-xs">🐢</span>
      </div>
      <div className="text-xs text-gray-500">
        {(value / 1000).toFixed(1)}s per turn
      </div>
    </div>
  );
}
