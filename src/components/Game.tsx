'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { PlayerPosition, TURN_ORDER } from '@/engine/types';
import { useGame, LastMoveInfo } from '@/hooks/useGame';
import { handPipCount } from '@/engine/tile';
import Board, { BoardHandle } from './Board';
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
    animDuration,
    setAnimDuration,
    lastMove,
    selectTile,
    playOnEnd,
    newRound,
    newGame,
  } = useGame();

  const { players, teams, board, currentPlayer, phase, round, turnHistory, roundResults, winner } =
    gameState;

  const revealAll = phase === 'round_over' || phase === 'game_over';

  // Refs for player hand areas and board center
  const northRef = useRef<HTMLDivElement>(null);
  const southRef = useRef<HTMLDivElement>(null);
  const eastRef = useRef<HTMLDivElement>(null);
  const westRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const boardHandle = useRef<BoardHandle>(null);

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
            revealTiles={revealAll}
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
            revealTiles={revealAll}
          />
        </div>

        {/* Board */}
        <div
          ref={boardRef}
          className="flex-1 mx-2 rounded-xl min-h-32 relative min-w-0 overflow-hidden"
          style={{
            background: 'var(--table-dark)',
            border: '2px solid rgba(255,255,255,0.1)',
            minHeight: '120px',
          }}
        >
          <Board
            ref={boardHandle}
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
            revealTiles={revealAll}
          />
        </div>
      </div>

      {/* Bottom: South player (you) + sidebar info */}
      <div className="flex items-end gap-4 pb-3 px-4">
        {/* Scoreboard + Speed */}
        <div className="flex-shrink-0 flex flex-col gap-2">
          <Scoreboard teams={teams} round={round} />
          <SpeedSlider
            aiDelay={aiDelay}
            onAiDelayChange={setAiDelay}
            animDuration={animDuration}
            onAnimDurationChange={setAnimDuration}
          />
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
          getToElement={() => {
            if (!boardHandle.current) return boardRef.current;
            return flyingMove.end === 'left'
              ? boardHandle.current.getLeftEndRef()
              : boardHandle.current.getRightEndRef();
          }}
          duration={animDuration}
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
                    {result.winningTeam === 'Tie' ? 'Tie — both teams penalized' : `${result.winningTeam} wins the round!`}
                  </p>
                </>
              );
            })()}

            {/* Per-player remaining pip counts */}
            <div className="mt-4 bg-black/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                Remaining Pips
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                {TURN_ORDER.map((pos) => {
                  const p = players[pos];
                  const pips = handPipCount(p.hand);
                  return (
                    <div key={pos} className="flex justify-between gap-2">
                      <span className="text-gray-300">{p.name}</span>
                      <span className={pips === 0 ? 'text-green-400 font-bold' : 'text-red-300'}>
                        {pips}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

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
