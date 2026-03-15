
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GameState,
  GameMove,
  Tile,
  BoardEnd,
  PlayerPosition,
  isPassMove,
} from '@/engine/types';
import {
  initGame,
  startNewRound,
  executeMove,
  executeAITurn,
  getValidMovesForCurrentPlayer,
  createGameRuleEngine,
} from '@/engine/game';
import { RuleEngine } from '@/engine/rules';
import { getValidPlacements } from '@/engine/board';
import { getCoachAdvice, CoachAdvice } from '@/engine/coach';

const DEFAULT_DELAY_MS = 1500;

export interface LastMoveInfo {
  playerPosition: PlayerPosition;
  tileId: string;
  tile: Tile;
  reversed: boolean;
  end: BoardEnd;
  timestamp: number;
}

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(() => initGame());
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [validEnds, setValidEnds] = useState<BoardEnd[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiDelay, setAiDelay] = useState(DEFAULT_DELAY_MS);
  const [animDuration, setAnimDuration] = useState(1500);
  const [lastMove, setLastMove] = useState<LastMoveInfo | null>(null);
  const [coachingEnabled, setCoachingEnabled] = useState(false);
  const rulesRef = useRef<RuleEngine>(createGameRuleEngine());
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiDelayRef = useRef(aiDelay);
  const animDurationRef = useRef(animDuration);

  // Keep refs in sync so callbacks always read the latest value
  useEffect(() => {
    aiDelayRef.current = aiDelay;
  }, [aiDelay]);
  useEffect(() => {
    animDurationRef.current = animDuration;
  }, [animDuration]);

  // Effective delay between AI turns: must wait for animation to finish
  const getEffectiveDelay = () =>
    Math.max(aiDelayRef.current, animDurationRef.current + 200);

  const rules = rulesRef.current;

  const validMoves =
    gameState.phase === 'playing' &&
    gameState.players[gameState.currentPlayer].isHuman
      ? getValidMovesForCurrentPlayer(gameState, rules)
      : [];

  // Coaching advice — only compute when it's the human's turn and coaching is on
  const coachAdvice: CoachAdvice | null =
    coachingEnabled &&
    gameState.phase === 'playing' &&
    gameState.players[gameState.currentPlayer].isHuman
      ? getCoachAdvice(gameState, rules)
      : null;

  // Handle AI turns automatically
  const processAITurns = useCallback(
    (state: GameState) => {
      if (state.phase !== 'playing') return;
      if (state.players[state.currentPlayer].isHuman) return;

      setIsAIThinking(true);
      const delay = getEffectiveDelay();
      aiTimerRef.current = setTimeout(() => {
        setGameState((prev) => {
          if (prev.phase !== 'playing') return prev;
          if (prev.players[prev.currentPlayer].isHuman) return prev;

          const whoPlayed = prev.currentPlayer;
          const newState = executeAITurn(prev, rules);

          // Track last move for animation
          const lastAction = newState.turnHistory[newState.turnHistory.length - 1];
          if (lastAction && !isPassMove(lastAction)) {
            const placed = newState.board.chain.find(
              (p) => p.tile.id === lastAction.tile.id
            );
            setLastMove({
              playerPosition: whoPlayed,
              tileId: lastAction.tile.id,
              tile: lastAction.tile,
              reversed: placed?.reversed ?? false,
              end: lastAction.end,
              timestamp: Date.now(),
            });
          }

          if (
            newState.phase === 'playing' &&
            !newState.players[newState.currentPlayer].isHuman
          ) {
            setTimeout(() => processAITurns(newState), getEffectiveDelay());
          } else {
            setIsAIThinking(false);
          }

          return newState;
        });
      }, delay);
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
        setSelectedTile(null);
        setValidEnds([]);
        return;
      }

      const ends = getValidPlacements(tile, gameState.board);
      if (ends.length === 0) return;

      if (ends.length === 1) {
        const move: GameMove = {
          playerPosition: gameState.currentPlayer,
          tile,
          end: ends[0],
        };
        if (!rules.hasHardViolation(move, gameState)) {
          setSelectedTile(null);
          setValidEnds([]);
          setGameState((prev) => {
            const newState = executeMove(prev, move);
            const placed = newState.board.chain.find(
              (p) => p.tile.id === tile.id
            );
            setLastMove({
              playerPosition: gameState.currentPlayer,
              tileId: tile.id,
              tile,
              reversed: placed?.reversed ?? false,
              end: ends[0],
              timestamp: Date.now(),
            });
            if (
              newState.phase === 'playing' &&
              !newState.players[newState.currentPlayer].isHuman
            ) {
              setTimeout(() => processAITurns(newState), aiDelayRef.current);
            }
            return newState;
          });
          return;
        }
      }

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
        const placed = newState.board.chain.find(
          (p) => p.tile.id === selectedTile.id
        );
        setLastMove({
          playerPosition: gameState.currentPlayer,
          tileId: selectedTile.id,
          tile: selectedTile,
          reversed: placed?.reversed ?? false,
          end,
          timestamp: Date.now(),
        });
        if (
          newState.phase === 'playing' &&
          !newState.players[newState.currentPlayer].isHuman
        ) {
          setTimeout(() => processAITurns(newState), aiDelayRef.current);
        }
        return newState;
      });
    },
    [selectedTile, gameState, rules, processAITurns]
  );

  const newRound = useCallback(() => {
    setSelectedTile(null);
    setValidEnds([]);
    setLastMove(null);
    setGameState((prev) => startNewRound(prev));
  }, []);

  const newGame = useCallback(() => {
    setSelectedTile(null);
    setValidEnds([]);
    setLastMove(null);
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
  };
}
