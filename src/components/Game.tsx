
import React, { useRef, useState, useCallback } from 'react';
import { PlayerPosition, TURN_ORDER } from '@/engine/types';
import { useGame, LastMoveInfo } from '@/hooks/useGame';
import { useCompact } from '@/hooks/useCompact';
import { handPipCount } from '@/engine/tile';
import Board, { BoardHandle } from './Board';
import PlayerHand from './PlayerHand';
import Scoreboard from './Scoreboard';
import GameLog from './GameLog';
import SpeedSlider from './SpeedSlider';
import FlyingTile from './FlyingTile';
import CoachPanel from './CoachPanel';

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
    coachingEnabled,
    setCoachingEnabled,
    coachAdvice,
    selectTile,
    playOnEnd,
    newRound,
    newGame,
  } = useGame();

  const isCompact = useCompact();
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  // Synchronously start flying animation when lastMove changes (during render,
  // before paint) so the tile on the board is hidden from the very first frame.
  if (lastMove && lastMove.timestamp !== lastMoveTimestamp.current) {
    lastMoveTimestamp.current = lastMove.timestamp;
    setFlyingMove(lastMove);
    setHiddenTileId(lastMove.tileId);
  }

  const onFlyComplete = useCallback(() => {
    setFlyingMove(null);
    setHiddenTileId(null);
  }, []);

  return (
    <div className="w-screen flex flex-col" style={{ background: 'var(--table-green)', height: '100dvh' }}>
      {/* Top: North player */}
      <div className={`flex justify-center items-start gap-4 ${isCompact ? 'pt-1 px-2' : 'pt-2 px-4'}`}>
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
      <div className={`flex-1 flex items-center ${isCompact ? 'px-1' : 'px-2'} min-h-0`}>
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
            minHeight: isCompact ? '80px' : '120px',
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
      {isCompact ? (
        <div className="flex items-end gap-2 pb-1 px-2">
          {/* Compact inline scoreboard */}
          <div className="flex-shrink-0 bg-black/30 rounded-md px-2 py-1 text-xs flex items-center gap-3">
            <span className="text-gray-400">R{round}</span>
            {teams.map((t) => (
              <span key={t.name} className="text-yellow-300 font-bold">
                {t.name.split(' ').map(w => w[0]).join('')}: {t.score}
              </span>
            ))}
          </div>

          {/* Compact coach suggestion */}
          {coachingEnabled && currentPlayer === 'south' && phase === 'playing' && (
            <div className="flex-shrink-0 bg-cyan-900/50 border border-cyan-500/30 rounded-md px-2 py-1 text-xs flex items-center gap-1.5">
              <span>🧠</span>
              {coachAdvice?.suggestion ? (
                <>
                  <span className="font-mono text-yellow-200">
                    [{coachAdvice.suggestion.move.tile.left}|{coachAdvice.suggestion.move.tile.right}]
                  </span>
                  <span className="text-cyan-300">→ {coachAdvice.suggestion.move.end}</span>
                </>
              ) : (
                <span className="text-gray-400">pass</span>
              )}
            </div>
          )}

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
              tileSize="md"
              suggestedTileId={
                coachingEnabled && coachAdvice?.suggestion && currentPlayer === 'south'
                  ? coachAdvice.suggestion.move.tile.id
                  : null
              }
            />
          </div>

          {/* Settings toggle */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="flex-shrink-0 bg-black/40 text-gray-300 rounded-md px-2 py-1.5 text-sm hover:bg-black/60 transition-colors"
          >
            ⚙️
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-4 pb-3 px-4">
          {/* Scoreboard + Speed + Coach toggle */}
          <div className="flex-shrink-0 flex flex-col gap-2">
            <Scoreboard teams={teams} round={round} />
            <SpeedSlider
              aiDelay={aiDelay}
              onAiDelayChange={setAiDelay}
              animDuration={animDuration}
              onAnimDurationChange={setAnimDuration}
            />
            <button
              onClick={() => setCoachingEnabled(!coachingEnabled)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                coachingEnabled
                  ? 'bg-cyan-900/60 border-cyan-500 text-cyan-300'
                  : 'bg-gray-800/60 border-gray-600 text-gray-400 hover:border-gray-500'
              }`}
            >
              🧠 Coach {coachingEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Coach Panel */}
          {coachingEnabled && coachAdvice && currentPlayer === 'south' && phase === 'playing' && (
            <div className="flex-shrink-0">
              <CoachPanel advice={coachAdvice} />
            </div>
          )}

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
              suggestedTileId={
                coachingEnabled && coachAdvice?.suggestion && currentPlayer === 'south'
                  ? coachAdvice.suggestion.move.tile.id
                  : null
              }
            />
          </div>

          {/* Game Log */}
          <div className="flex-shrink-0">
            <GameLog history={turnHistory} />
          </div>
        </div>
      )}

      {/* Compact settings drawer (overlay) */}
      {isCompact && drawerOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-gray-900/95 border-t border-white/10 p-3 flex gap-3 overflow-x-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Scoreboard teams={teams} round={round} />
            <SpeedSlider
              aiDelay={aiDelay}
              onAiDelayChange={setAiDelay}
              animDuration={animDuration}
              onAnimDurationChange={setAnimDuration}
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setCoachingEnabled(!coachingEnabled)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  coachingEnabled
                    ? 'bg-cyan-900/60 border-cyan-500 text-cyan-300'
                    : 'bg-gray-800/60 border-gray-600 text-gray-400 hover:border-gray-500'
                }`}
              >
                🧠 Coach {coachingEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <GameLog history={turnHistory} />
            {coachingEnabled && coachAdvice && currentPlayer === 'south' && phase === 'playing' && (
              <CoachPanel advice={coachAdvice} />
            )}
          </div>
        </div>
      )}

      {/* Flying tile overlay */}
      {flyingMove && (
        <FlyingTile
          key={flyingMove.timestamp}
          tile={flyingMove.tile}
          reversed={flyingMove.reversed}
          fromRef={playerRefs[flyingMove.playerPosition]}
          getToElement={() => {
            if (!boardHandle.current) return boardRef.current;
            const endEl = flyingMove.end === 'left'
              ? boardHandle.current.getLeftEndRef()
              : boardHandle.current.getRightEndRef();
            return endEl || boardRef.current;
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
          <div className={`bg-gray-900 rounded-xl text-center max-w-md shadow-2xl ${isCompact ? 'p-4' : 'p-8'}`}>
            <h2 className={`font-bold mb-2 ${isCompact ? 'text-lg' : 'text-2xl'}`}>Round {round} Over!</h2>
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
          <div className={`bg-gray-900 rounded-xl text-center max-w-md shadow-2xl ${isCompact ? 'p-4' : 'p-8'}`}>
            <h2 className={`font-bold mb-2 ${isCompact ? 'text-xl' : 'text-3xl'}`}>🏆 Game Over!</h2>
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
