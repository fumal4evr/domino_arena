import { Rule, GameMove, GameState, RuleViolation } from '../types';
import { getValidPlacements } from '../board';

/**
 * Base rule: the played tile must match the open end it's placed against.
 */
export const tileMatchesEndRule: Rule = {
  name: 'tile-matches-end',
  severity: 'hard',
  evaluate(move: GameMove, state: GameState): RuleViolation | null {
    const validEnds = getValidPlacements(move.tile, state.board);
    if (!validEnds.includes(move.end)) {
      return {
        ruleName: this.name,
        message: `Tile ${move.tile.id} cannot be placed on the ${move.end} end.`,
        severity: 'hard',
      };
    }
    return null;
  },
};

/**
 * Base rule: first move of the first round must be the double-6.
 */
export const doubleSixFirstRule: Rule = {
  name: 'double-six-first',
  severity: 'hard',
  evaluate(move: GameMove, state: GameState): RuleViolation | null {
    // Only applies to the very first move of the first round
    if (state.round !== 1 || state.board.chain.length > 0) {
      return null;
    }
    if (move.tile.left !== 6 || move.tile.right !== 6) {
      return {
        ruleName: this.name,
        message: 'The first move of the first round must be the double-6.',
        severity: 'hard',
      };
    }
    return null;
  },
};

/** All base rules */
export const BASE_RULES: Rule[] = [tileMatchesEndRule, doubleSixFirstRule];
