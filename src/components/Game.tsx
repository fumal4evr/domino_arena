'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { PlayerPosition } from '@/engine/types';
import { useGame, LastMoveInfo } from '@/hooks/useGame';
import Board from './Board';
import PlayerHand from './PlayerHand';
import Scoreboard from './Scoreboard';
import GameLog from './GameLog';
import SpeedSlider from './SpeedSlider';
import FlyingTile from './FlyingTile';

export default function Game() {
  const {
    gameState,
    selectedTile,
    validEnds,
    validMoves,
    isAIThinking,
    aiDelay,
    setAiDelay,
    lastMove,
    selectTile,
    playOnEnd,
    newRound,
    newGame,
  } = useGame();

  const { players, teams, board, currentPlayer, phase, round, turnHistory, roundResults, winner } =
    gameState;

  // Refs for player hand areas and board center
  const northRef = useRef<HTMLDivElement>(null);
  const southRef = useRef<HTMLDivElement>(null);
  const eastRef = useRef<HTMLDivElement>(null);
  const westRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const playerRefs: Record<PlayerPosition, React.RefObject<HTMLDivElement | null>> = {
    north: northRef,
    south: southRef,
    east: eastRef,
    west: westRef,
  };

  // Flying tile state
  const [flyingMove, setFlyingMove] = useState<LastMoveInfo | null>(null);
  const [hiddenTileId, setHiddenTileId] = useState<string | null>(null);
  const lastMoveTimestamp = useRef<number>(0);

  // When lastMove changes, start a flying animation
  useEffect(() => {
    if (!lastMove || lastMove.timestamp === lastMoveTimestamp.current) return;
    lastMoveTimestamp.current = lastMove.timestamp;
    setFlyingMove(lastMove);
    setHiddenTileId(lastMove.tileId);
  }, [lastMove]);

  const onFlyComplete = useCallback(() => {
    setFlyingMove(null);
    setHiddenTileId(null);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: 'var(--table-green)' }}>
      {/* Top: North player */}
      <div className="flex justify-center items-start gap-4 pt-2 px-4">
        <div ref={northRef} className="flex-1 flex justify-center">
          <PlayerHand
            tiles={players.north.hand}
            position="north"
            isCurrentPlayer={currentPlayer === 'north'}
            isHuman={false}
            selectedTile={null}
            validMoves={[]}
            onTileClick={() => {}}
          />
        </div>
      </div>

      {/* Middle: West + Board + East */}
      <div className="flex-1 flex items-center px-2 min-h-0">
        {/* West player */}
        <div ref={westRef} className="flex-shrink-0">
          <PlayerHand
            tiles={players.west.hand}
            position="west"
            isCurrentPlayer={currentPlayer === 'west'}
            isHuman={false}
            selectedTile={null}
            validMoves={[]}
            onTileClick={() => {}}
          />
        </div>

        {/* Board */}
        <div
          ref={boardRef}
          className="flex-1 mx-2 rounded-xl min-h-32 relative"
          style={{
            background: 'var(--table-dark)',
            border: '2px solid rgba(255,255,255,0.1)',
            minHeight: '120px',
          }}
        >
          <Board
            board={board}
            showEndButtons={!!selectedTile && validEnds.length > 1}
            validEnds={validEnds}
            onEndClick={playOnEnd}
            lastMove={lastMove}
            hiddenTileId={hiddenTileId}
          />
        </div>

        {/* East player */}
        <div ref={eastRef} className="flex-shrink-0">
          <PlayerHand
            tiles={players.east.hand}
            position="east"
            isCurrentPlayer={currentPlayer === 'east'}
            isHuman={false}
            selectedTile={null}
            validMoves={[]}
            onTileClick={() => {}}
          />
        </div>
      </div>

      {/* Bottom: South player (you) + sidebar info */}
      <div className="flex items-end gap-4 pb-3 px-4">
        {/* Scoreboard + Speed */}
        <div className="flex-shrink-0 flex flex-col gap-2">
          <Scoreboard teams={teams} round={round} />
          <SpeedSlider value={aiDelay} onChange={setAiDelay} />
        </div>

        {/* Your hand */}
        <div ref={southRef} className="flex-1 flex justify-center">
          <PlayerHand
            tiles={players.south.hand}
            position="south"
            isCurrentPlayer={currentPlayer === 'south'}
            isHuman={true}
            selectedTile={selectedTile}
            validMoves={validMoves}
            onTileClick={selectTile}
          />
        </div>

        {/* Game Log */}
        <div className="flex-shrink-0">
          <GameLog history={turnHistory} />
        </div>
      </div>

      {/* Flying tile overlay */}
      {flyingMove && (
        <FlyingTile
          key={flyingMove.timestamp}
          tile={flyingMove.tile}
          reversed={flyingMove.reversed}
          fromRef={playerRefs[flyingMove.playerPosition]}
          toRef={boardRef}
          onComplete={onFlyComplete}
        />
      )}

      {/* AI thinking indicator */}
      {isAIThinking && phase === 'playing' && !flyingMove && (
        <div className="fixed top-4 right-4 bg-black/60 text-yellow-300 px-3 py-1.5 rounded-lg text-sm animate-pulse">
          🤔 Thinking...
        </div>
      )}

      {/* Round Over overlay */}
      {phase === 'round_over' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 text-center max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-3">Round {round} Over!</h2>
            {roundResults.length > 0 && (() => {
              const result = roundResults[roundResults.length - 1];
              return (
                <>
                  <p className="text-lg mb-1">
                    {result.blocked ? '🔒 Blocked!' : '🎉 Domino!'}
                  </p>
                  <p className="text-yellow-300 text-xl font-bold mb-1">
                    {result.winningTeam}
                    {result.points > 0 ? ` +${result.points} pts` : ''}
                  </p>
                </>
              );
            })()}
            <div className="mt-4 space-y-1">
              {teams.map((t) => (
                <div key={t.name} className="flex justify-between gap-8">
                  <span>{t.name}</span>
                  <span className="font-bold text-yellow-300">{t.score}</span>
                </div>
              ))}
            </div>
            <button
              onClick={newRound}
              className="mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Next Round →
            </button>
          </div>
        </div>
      )}

      {/* Game Over overlay */}
      {phase === 'game_over' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 text-center max-w-md shadow-2xl">
            <h2 className="text-3xl font-bold mb-2">🏆 Game Over!</h2>
            <p className="text-yellow-300 text-2xl font-bold mb-4">
              {winner} wins!
            </p>
            <div className="space-y-1 mb-6">
              {teams.map((t) => (
                <div key={t.name} className="flex justify-between gap-8">
                  <span>{t.name}</span>
                  <span className="font-bold text-yellow-300">{t.score}</span>
                </div>
              ))}
            </div>
            <button
              onClick={newGame}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              New Game 🎲
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
