'use client';

import React from 'react';
import { useGame } from '@/hooks/useGame';
import Board from './Board';
import PlayerHand from './PlayerHand';
import Scoreboard from './Scoreboard';
import GameLog from './GameLog';

export default function Game() {
  const {
    gameState,
    selectedTile,
    validEnds,
    validMoves,
    isAIThinking,
    selectTile,
    playOnEnd,
    newRound,
    newGame,
  } = useGame();

  const { players, teams, board, currentPlayer, phase, round, turnHistory, roundResults, winner } =
    gameState;

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: 'var(--table-green)' }}>
      {/* Top: North player + Scoreboard */}
      <div className="flex justify-center items-start gap-4 pt-2 px-4">
        <div className="flex-1 flex justify-center">
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
        <div className="flex-shrink-0">
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
          />
        </div>

        {/* East player */}
        <div className="flex-shrink-0">
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
        {/* Scoreboard */}
        <div className="flex-shrink-0">
          <Scoreboard teams={teams} round={round} />
        </div>

        {/* Your hand */}
        <div className="flex-1 flex justify-center">
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

      {/* AI thinking indicator */}
      {isAIThinking && phase === 'playing' && (
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
