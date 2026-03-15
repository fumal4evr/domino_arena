'use client';

import React from 'react';

interface SpeedSliderProps {
  aiDelay: number;
  onAiDelayChange: (ms: number) => void;
  animDuration: number;
  onAnimDurationChange: (ms: number) => void;
}

export default function SpeedSlider({
  aiDelay,
  onAiDelayChange,
  animDuration,
  onAnimDurationChange,
}: SpeedSliderProps) {
  return (
    <div className="bg-black/30 rounded-lg px-3 py-2 flex flex-col items-center gap-1.5 min-w-40">
      {/* AI turn delay */}
      <div className="w-full">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider text-center mb-0.5">
          Turn Speed
        </div>
        <div className="flex items-center gap-2 w-full">
          <span className="text-xs">🐇</span>
          <input
            type="range"
            min={500}
            max={3000}
            step={250}
            value={aiDelay}
            onChange={(e) => onAiDelayChange(Number(e.target.value))}
            className="flex-1 h-1.5 accent-yellow-400 cursor-pointer"
          />
          <span className="text-xs">🐢</span>
        </div>
        <div className="text-[10px] text-gray-500 text-center">
          {(aiDelay / 1000).toFixed(1)}s per turn
        </div>
      </div>

      {/* Animation speed */}
      <div className="w-full border-t border-white/10 pt-1.5">
        <div className="text-[10px] text-gray-400 uppercase tracking-wider text-center mb-0.5">
          Animation
        </div>
        <div className="flex items-center gap-2 w-full">
          <span className="text-xs">⚡</span>
          <input
            type="range"
            min={300}
            max={2000}
            step={100}
            value={animDuration}
            onChange={(e) => onAnimDurationChange(Number(e.target.value))}
            className="flex-1 h-1.5 accent-cyan-400 cursor-pointer"
          />
          <span className="text-xs">🎬</span>
        </div>
        <div className="text-[10px] text-gray-500 text-center">
          {(animDuration / 1000).toFixed(1)}s fly time
        </div>
      </div>
    </div>
  );
}
