import { GameMove, GameState, Tile } from '../types';
import { getAllValidMoves } from '../board';
import { pipCount } from '../tile';
import { RuleEngine } from '../rules';

export interface AIStrategy {
  name: string;
  chooseMove(
    hand: Tile[],
    state: GameState,
    rules: RuleEngine
  ): GameMove | null;
}

export { basicAI } from './basic-ai';
export { coachAI } from './coach-ai';
