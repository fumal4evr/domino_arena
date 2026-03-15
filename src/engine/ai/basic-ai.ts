import { AIStrategy } from './index';
import { GameMove, GameState, Tile } from '../types';
import { getAllValidMoves } from '../board';
import { pipCount } from '../tile';
import { RuleEngine } from '../rules';

/**
 * Basic AI strategy:
 * 1. Get all valid moves
 * 2. Filter out hard-rule violations
 * 3. Prefer moves without soft-rule violations
 * 4. Among remaining, play the tile with the highest pip count
 */
export const basicAI: AIStrategy = {
  name: 'basic',
  chooseMove(
    hand: Tile[],
    state: GameState,
    rules: RuleEngine
  ): GameMove | null {
    const allMoves = getAllValidMoves(hand, state.board, state.currentPlayer);

    if (allMoves.length === 0) return null;

    // Filter out hard-rule violations
    const legalMoves = allMoves.filter(
      (move) => !rules.hasHardViolation(move, state)
    );

    if (legalMoves.length === 0) return null;

    // Separate into preferred (no soft violations) and fallback
    const preferred = legalMoves.filter(
      (move) => rules.getSoftViolations(move, state).length === 0
    );

    const candidates = preferred.length > 0 ? preferred : legalMoves;

    // Pick the move with the highest pip count
    candidates.sort((a, b) => pipCount(b.tile) - pipCount(a.tile));
    return candidates[0];
  },
};
