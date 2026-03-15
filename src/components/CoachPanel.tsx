'use client';

import React from 'react';
import { CoachAdvice, HandAnalysis, MoveSuggestion } from '@/engine/coach';
import { PipValue } from '@/engine/types';

interface CoachPanelProps {
  advice: CoachAdvice;
}

const PIP_EMOJI: Record<PipValue, string> = {
  0: '⬜', 1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣', 5: '5️⃣', 6: '6️⃣',
};

function HandAnalysisSection({ analysis }: { analysis: HandAnalysis }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">
        Hand Analysis
      </div>
      <div className="flex gap-1 flex-wrap">
        {([0, 1, 2, 3, 4, 5, 6] as PipValue[]).map((pip) => (
          <span
            key={pip}
            className={`text-xs px-1.5 py-0.5 rounded ${
              analysis.distribution[pip] >= 3
                ? 'bg-green-800/60 text-green-300 font-bold'
                : analysis.distribution[pip] === 0
                ? 'bg-red-900/40 text-red-400 line-through'
                : 'bg-gray-800/50 text-gray-400'
            }`}
          >
            {pip}: {analysis.distribution[pip]}
          </span>
        ))}
      </div>
      {analysis.strongNumbers.length > 0 && (
        <p className="text-xs text-green-300">
          💪 Strong: {analysis.strongNumbers.map((p) => PIP_EMOJI[p]).join(' ')}
        </p>
      )}
      {analysis.missingNumbers.length > 0 && (
        <p className="text-xs text-red-300">
          ❌ Missing: {analysis.missingNumbers.map((p) => PIP_EMOJI[p]).join(' ')}
        </p>
      )}
    </div>
  );
}

function SuggestionSection({ suggestion, label }: { suggestion: MoveSuggestion; label: string }) {
  const { move, score, explanation } = suggestion;
  return (
    <div className="bg-cyan-900/30 rounded-md px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-cyan-200">{label}</span>
        <span className="text-[10px] text-gray-500">score: {score}</span>
      </div>
      <div className="text-sm text-white mt-0.5">
        <span className="font-mono text-yellow-200">
          [{move.tile.left}|{move.tile.right}]
        </span>{' '}
        → {move.end}
      </div>
      <p className="text-[11px] text-cyan-300/80 mt-0.5">{explanation}</p>
    </div>
  );
}

export default function CoachPanel({ advice }: CoachPanelProps) {
  const { handAnalysis, suggestion, alternatives } = advice;

  return (
    <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-3 min-w-52 max-w-64 flex flex-col gap-2" style={{ maxHeight: '40vh' }}>
      <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
        🧠 Coach
      </div>

      {handAnalysis && <HandAnalysisSection analysis={handAnalysis} />}

      {suggestion ? (
        <>
          <SuggestionSection suggestion={suggestion} label="▶ Suggested" />
          {alternatives.length > 0 && (
            <div className="overflow-y-auto space-y-1 flex-1">
              <div className="text-[10px] text-gray-500 uppercase">Alternatives</div>
              {alternatives.slice(0, 4).map((alt, i) => (
                <div key={i} className="bg-gray-800/40 rounded px-2 py-1 text-xs">
                  <span className="font-mono text-gray-300">
                    [{alt.move.tile.left}|{alt.move.tile.right}]
                  </span>{' '}
                  → {alt.move.end}
                  <span className="text-gray-500 ml-1">({alt.score})</span>
                  <p className="text-[10px] text-gray-500">{alt.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-xs text-gray-500 italic">No playable tiles — must pass ✋</div>
      )}
    </div>
  );
}
