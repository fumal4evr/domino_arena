import { AIStrategy } from './index';
import { GameMove, GameState, Tile } from '../types';
import { RuleEngine } from '../rules';
import { getCoachAdvice } from '../coach';

/**
 * Coach AI strategy:
 * Uses the same scoring heuristics as the coaching panel —
 * pip dump, doubles priority, play strength, variety, blocking, partner respect.
 */
export const coachAI: AIStrategy = {
  name: 'coach',
  chooseMove(
    hand: Tile[],
    state: GameState,
    rules: RuleEngine
  ): GameMove | null {
    const advice = getCoachAdvice(state, rules);
    return advice.suggestion?.move ?? null;
  },
};
