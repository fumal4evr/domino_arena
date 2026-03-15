'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GameState,
  GameMove,
  Tile,
  BoardEnd,
  isPassMove,
} from '@/engine/types';
import {
  initGame,
  startNewRound,
  executeMove,
  executePass,
  executeAITurn,
  getValidMovesForCurrentPlayer,
  mustPass,
  createGameRuleEngine,
} from '@/engine/game';
import { RuleEngine } from '@/engine/rules';
import { getValidPlacements } from '@/engine/board';

const AI_DELAY_MS = 800;

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(() => initGame());
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [validEnds, setValidEnds] = useState<BoardEnd[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const rulesRef = useRef<RuleEngine>(createGameRuleEngine());
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rules = rulesRef.current;

  const validMoves =
    gameState.phase === 'playing' &&
    gameState.players[gameState.currentPlayer].isHuman
      ? getValidMovesForCurrentPlayer(gameState, rules)
      : [];

  // Handle AI turns automatically
  const processAITurns = useCallback(
    (state: GameState) => {
      if (state.phase !== 'playing') return;
      if (state.players[state.currentPlayer].isHuman) return;

      setIsAIThinking(true);
      aiTimerRef.current = setTimeout(() => {
        setGameState((prev) => {
          if (prev.phase !== 'playing') return prev;
          if (prev.players[prev.currentPlayer].isHuman) return prev;

          let newState = executeAITurn(prev, rules);

          // Continue processing AI turns if the next player is also AI
          // (we schedule them rather than looping to allow React renders)
          if (
            newState.phase === 'playing' &&
            !newState.players[newState.currentPlayer].isHuman
          ) {
            // Schedule next AI turn
            setTimeout(() => processAITurns(newState), AI_DELAY_MS);
          } else {
            setIsAIThinking(false);

            // Auto-pass for human if they must pass
            if (
              newState.phase === 'playing' &&
              newState.players[newState.currentPlayer].isHuman &&
              mustPass(newState, rules)
            ) {
              // Brief delay then auto-pass
              setTimeout(() => {
                setGameState((s) => {
                  if (s.phase !== 'playing') return s;
                  const passed = executePass(s);
                  // After human auto-pass, check if AI is next
                  if (
                    passed.phase === 'playing' &&
                    !passed.players[passed.currentPlayer].isHuman
                  ) {
                    setTimeout(() => processAITurns(passed), AI_DELAY_MS);
                  }
                  return passed;
                });
              }, 500);
            }
          }

          return newState;
        });
      }, AI_DELAY_MS);
    },
    [rules]
  );

  // Trigger AI turns when current player changes
  useEffect(() => {
    if (
      gameState.phase === 'playing' &&
      !gameState.players[gameState.currentPlayer].isHuman
    ) {
      processAITurns(gameState);
    }
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [gameState.currentPlayer, gameState.phase, gameState.round]);

  // Handle human player selecting a tile
  const selectTile = useCallback(
    (tile: Tile) => {
      if (gameState.phase !== 'playing') return;
      if (!gameState.players[gameState.currentPlayer].isHuman) return;

      if (selectedTile?.id === tile.id) {
        // Deselect
        setSelectedTile(null);
        setValidEnds([]);
        return;
      }

      // Check which ends this tile can go on
      const ends = getValidPlacements(tile, gameState.board);
      if (ends.length === 0) return;

      if (ends.length === 1) {
        // Only one option: play immediately
        const move: GameMove = {
          playerPosition: gameState.currentPlayer,
          tile,
          end: ends[0],
        };
        // Verify against rules
        if (!rules.hasHardViolation(move, gameState)) {
          setSelectedTile(null);
          setValidEnds([]);
          setGameState((prev) => {
            const newState = executeMove(prev, move);
            if (
              newState.phase === 'playing' &&
              !newState.players[newState.currentPlayer].isHuman
            ) {
              setTimeout(() => processAITurns(newState), AI_DELAY_MS);
            }
            return newState;
          });
          return;
        }
      }

      // Multiple options: show end selection
      setSelectedTile(tile);
      setValidEnds(ends);
    },
    [gameState, selectedTile, rules, processAITurns]
  );

  // Handle human player choosing an end to play on
  const playOnEnd = useCallback(
    (end: BoardEnd) => {
      if (!selectedTile) return;

      const move: GameMove = {
        playerPosition: gameState.currentPlayer,
        tile: selectedTile,
        end,
      };

      if (rules.hasHardViolation(move, gameState)) return;

      setSelectedTile(null);
      setValidEnds([]);
      setGameState((prev) => {
        const newState = executeMove(prev, move);
        if (
          newState.phase === 'playing' &&
          !newState.players[newState.currentPlayer].isHuman
        ) {
          setTimeout(() => processAITurns(newState), AI_DELAY_MS);
        }
        return newState;
      });
    },
    [selectedTile, gameState, rules, processAITurns]
  );

  // Start a new round
  const newRound = useCallback(() => {
    setSelectedTile(null);
    setValidEnds([]);
    setGameState((prev) => {
      const next = startNewRound(prev);
      return next;
    });
  }, []);

  // Start a brand new game
  const newGame = useCallback(() => {
    setSelectedTile(null);
    setValidEnds([]);
    setIsAIThinking(false);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setGameState(initGame());
  }, []);

  return {
    gameState,
    selectedTile,
    validEnds,
    validMoves,
    isAIThinking,
    selectTile,
    playOnEnd,
    newRound,
    newGame,
  };
}
