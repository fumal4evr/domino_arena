import {
  Tile,
  PipValue,
  GameState,
  GameMove,
  PlayerPosition,
  isPassMove,
  getPartner,
} from './types';
import { pipCount, isDouble } from './tile';
import { getAllValidMoves } from './board';
import { RuleEngine } from './rules';
import { computeLeadOrder, isLead } from './strategy';

// ─── Types ───

export interface HandAnalysis {
  /** How many tiles contain each pip value */
  distribution: Record<PipValue, number>;
  /** Pip values appearing 3+ times in hand */
  strongNumbers: PipValue[];
  /** Pip values not appearing in hand at all */
  missingNumbers: PipValue[];
}

export interface MoveSuggestion {
  move: GameMove;
  score: number;
  explanation: string;
}

export interface CoachAdvice {
  /** Hand analysis shown before the first play of the round */
  handAnalysis: HandAnalysis | null;
  /** Best suggested move (null if must pass) */
  suggestion: MoveSuggestion | null;
  /** Other legal moves ranked by score */
  alternatives: MoveSuggestion[];
}

// ─── Hand Analysis ───

const ALL_PIPS: PipValue[] = [0, 1, 2, 3, 4, 5, 6];

export function analyzeHand(hand: Tile[]): HandAnalysis {
  const distribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as Record<PipValue, number>;
  for (const tile of hand) {
    distribution[tile.left]++;
    if (tile.left !== tile.right) {
      distribution[tile.right]++;
    }
  }

  const strongNumbers = ALL_PIPS.filter((p) => distribution[p] >= 3);
  const missingNumbers = ALL_PIPS.filter((p) => distribution[p] === 0);

  return { distribution, strongNumbers, missingNumbers };
}

// ─── Opponent Pass Tracking ───

/** Collect pip values each opponent has passed on (couldn't play when that value was open). */
function getOpponentPassedValues(
  state: GameState,
  humanPos: PlayerPosition
): Map<PlayerPosition, Set<PipValue>> {
  const partner = getPartner(humanPos);
  const passed = new Map<PlayerPosition, Set<PipValue>>();

  // Track what was open at each point by replaying history
  let leftOpen: PipValue | null = null;
  let rightOpen: PipValue | null = null;

  for (const action of state.turnHistory) {
    if (isPassMove(action)) {
      // This player couldn't play on whatever was open
      if (action.playerPosition !== humanPos && action.playerPosition !== partner) {
        const openValues = new Set<PipValue>();
        if (leftOpen !== null) openValues.add(leftOpen);
        if (rightOpen !== null) openValues.add(rightOpen);
        if (!passed.has(action.playerPosition)) {
          passed.set(action.playerPosition, new Set());
        }
        for (const v of openValues) {
          passed.get(action.playerPosition)!.add(v);
        }
      }
    } else {
      // Update board open values after this move
      const t = action.tile;
      if (leftOpen === null && rightOpen === null) {
        // First tile
        leftOpen = t.left;
        rightOpen = t.right;
      } else if (action.end === 'left') {
        const connectValue: PipValue = leftOpen!;
        leftOpen = t.left === connectValue ? t.right : t.left;
      } else {
        const connectValue: PipValue = rightOpen!;
        rightOpen = t.left === connectValue ? t.right : t.left;
      }
    }
  }

  return passed;
}

// ─── Move Scoring ───

/** Score a single move. Higher = better. Returns suggestion with explanation. */
function scoreMove(
  move: GameMove,
  state: GameState,
  hand: Tile[],
  rules: RuleEngine,
  analysis: HandAnalysis,
  opponentPassed: Map<PlayerPosition, Set<PipValue>>,
): MoveSuggestion {
  let score = 0;
  const reasons: string[] = [];
  const tile = move.tile;

  // 1. Pip dump: prefer playing higher-pip tiles to reduce penalty risk
  const pips = pipCount(tile);
  const pipBonus = pips * 2;
  score += pipBonus;
  if (pips >= 8) reasons.push(`dumps ${pips} pips`);

  // 2. Doubles priority: doubles should be played early (only one value to connect)
  if (isDouble(tile)) {
    score += 8;
    reasons.push('plays a double early');
  }

  // 3. Play your strength: prefer leaving open ends with values you hold many of
  const openValueAfter = getOpenValueAfterMove(move, state);
  if (openValueAfter !== null) {
    const strength = analysis.distribution[openValueAfter];
    // Count how many remaining tiles (after playing this one) still have that value
    const remainingWithValue = hand.filter(
      (t) => t.id !== tile.id && (t.left === openValueAfter || t.right === openValueAfter)
    ).length;
    if (remainingWithValue >= 2) {
      score += remainingWithValue * 3;
      reasons.push(`opens ${openValueAfter} (you have ${remainingWithValue} more)`);
    }
  }

  // 4. Keep variety: penalize moves that leave you with no way to play common values
  const remainingHand = hand.filter((t) => t.id !== tile.id);
  const remainingAnalysis = analyzeHand(remainingHand);
  const newMissing = remainingAnalysis.missingNumbers.length - analysis.missingNumbers.length;
  if (newMissing > 0) {
    score -= newMissing * 4;
    reasons.push('reduces hand variety');
  }

  // 5. Block opponents: if an opponent passed on a value, exposing it is good
  if (openValueAfter !== null) {
    let blocksOpponent = false;
    for (const [, passedVals] of opponentPassed) {
      if (passedVals.has(openValueAfter)) {
        blocksOpponent = true;
        break;
      }
    }
    if (blocksOpponent) {
      score += 6;
      reasons.push(`opponent can't play ${openValueAfter}`);
    }
  }

  // 6. Don't cover partner: check soft rule violations
  const violations = rules.getSoftViolations(move, state);
  if (violations.length > 0) {
    score -= 10;
    reasons.push("covers partner's play");
  }

  // 7. Strong suit strategy (lead/runt system)
  const myPos = move.playerPosition;
  const partnerPos = getPartner(myPos);
  const myStrong = state.strongSuits[myPos];
  const partnerStrong = state.strongSuits[partnerPos];
  const iAmLead = isLead(myPos, state);
  const partnerIsLead = isLead(partnerPos, state);

  // What open value does this move replace (cover)?
  const coveredValue = getCoveredValue(move, state);

  if (openValueAfter !== null) {
    // Bonus for opening your own strong suit
    if (myStrong.includes(openValueAfter)) {
      const bonus = iAmLead ? 8 : 5;
      score += bonus;
      reasons.push(`develops strong suit ${openValueAfter}`);
    }

    // Bonus for opening partner's strong suit (bigger if partner is lead)
    if (partnerStrong.includes(openValueAfter)) {
      const bonus = partnerIsLead ? 7 : 4;
      score += bonus;
      reasons.push(`helps partner's suit ${openValueAfter}`);
    }
  }

  // Penalty for covering your own strong suit
  if (coveredValue !== null && myStrong.includes(coveredValue)) {
    // Only penalize if we had a choice (more than one legal move)
    score -= iAmLead ? 10 : 6;
    reasons.push(`covers own strong suit ${coveredValue}`);
  }

  // Penalty for covering partner's strong suit when partner is lead
  if (coveredValue !== null && partnerStrong.includes(coveredValue) && partnerIsLead) {
    score -= 6;
    reasons.push(`covers partner's strong suit ${coveredValue}`);
  }

  const explanation = reasons.length > 0
    ? reasons.join('; ')
    : `plays [${tile.left}|${tile.right}] on ${move.end}`;

  return { move, score, explanation };
}

/** Determine what open value a move would create on its end. */
function getOpenValueAfterMove(move: GameMove, state: GameState): PipValue | null {
  const tile = move.tile;
  const board = state.board;

  if (board.chain.length === 0) {
    // First tile: opens both ends
    return null;
  }

  if (move.end === 'left') {
    const connectValue = board.leftOpen!;
    return tile.left === connectValue ? tile.right : tile.left;
  } else {
    const connectValue = board.rightOpen!;
    return tile.left === connectValue ? tile.right : tile.left;
  }
}

/** Determine the open value that a move would replace (cover) on the board. */
function getCoveredValue(move: GameMove, state: GameState): PipValue | null {
  const board = state.board;
  if (board.chain.length === 0) return null;

  return move.end === 'left' ? board.leftOpen! : board.rightOpen!;
}

// ─── Main Entry ───

export function getCoachAdvice(
  state: GameState,
  rules: RuleEngine
): CoachAdvice {
  const player = state.players[state.currentPlayer];
  const hand = player.hand;
  const analysis = analyzeHand(hand);

  // Show hand analysis on the first move of the round
  const isFirstMove = state.board.chain.length === 0;
  const handAnalysis = isFirstMove ? analysis : null;

  // Get all legal moves
  const allMoves = getAllValidMoves(hand, state.board, state.currentPlayer);
  const legalMoves = allMoves.filter((m) => !rules.hasHardViolation(m, state));

  if (legalMoves.length === 0) {
    return { handAnalysis, suggestion: null, alternatives: [] };
  }

  const opponentPassed = getOpponentPassedValues(state, state.currentPlayer);

  // Score all moves
  const scored = legalMoves
    .map((m) => scoreMove(m, state, hand, rules, analysis, opponentPassed))
    .sort((a, b) => b.score - a.score);

  const suggestion = scored[0];
  const alternatives = scored.slice(1);

  return { handAnalysis, suggestion, alternatives };
}
