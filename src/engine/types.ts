// ─── Core Domain Types ───

export type PipValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Tile {
  left: PipValue;
  right: PipValue;
  id: string; // e.g. "3|5"
}

export type PlayerPosition = 'south' | 'east' | 'north' | 'west';

export interface Player {
  position: PlayerPosition;
  name: string;
  hand: Tile[];
  isHuman: boolean;
}

export interface Team {
  name: string;
  positions: [PlayerPosition, PlayerPosition];
  score: number;
}

// ─── Board Types ───

export type BoardEnd = 'left' | 'right';

export interface PlayedTile {
  tile: Tile;
  /** Which pip value faces outward (is the open end) */
  openValue: PipValue;
  /** Which end of the board this tile was placed on */
  placedAt: BoardEnd;
  /** If true, display the tile reversed (right|left instead of left|right) */
  reversed: boolean;
}

export interface BoardState {
  /** Ordered chain of played tiles from left to right */
  chain: PlayedTile[];
  /** Current open value on the left end of the chain */
  leftOpen: PipValue | null;
  /** Current open value on the right end of the chain */
  rightOpen: PipValue | null;
}

// ─── Move Types ───

export interface GameMove {
  playerPosition: PlayerPosition;
  tile: Tile;
  end: BoardEnd;
}

export interface PassMove {
  playerPosition: PlayerPosition;
  pass: true;
}

export type TurnAction = GameMove | PassMove;

export function isPassMove(action: TurnAction): action is PassMove {
  return 'pass' in action;
}

// ─── Rules Types ───

export type RuleSeverity = 'hard' | 'soft';

export interface RuleViolation {
  ruleName: string;
  message: string;
  severity: RuleSeverity;
}

export interface Rule {
  name: string;
  severity: RuleSeverity;
  /** Return a violation if the move breaks this rule, or null if OK */
  evaluate(move: GameMove, state: GameState): RuleViolation | null;
}

// ─── Game State ───

export type GamePhase = 'dealing' | 'playing' | 'round_over' | 'game_over';

export interface RoundResult {
  winningTeam: string;
  points: number;
  blocked: boolean; // true if round ended by all players blocked
}

export interface GameState {
  players: Record<PlayerPosition, Player>;
  teams: [Team, Team];
  board: BoardState;
  currentPlayer: PlayerPosition;
  phase: GamePhase;
  round: number;
  roundStarter: PlayerPosition;
  turnHistory: TurnAction[];
  roundResults: RoundResult[];
  winner: string | null; // team name if game is over
  /** Strong suits per player, computed at round start from initial hands */
  strongSuits: Record<PlayerPosition, PipValue[]>;
}

// ─── Turn Order (clockwise) ───

export const TURN_ORDER: PlayerPosition[] = ['south', 'east', 'north', 'west'];

export function nextPlayer(current: PlayerPosition): PlayerPosition {
  const idx = TURN_ORDER.indexOf(current);
  return TURN_ORDER[(idx + 1) % 4];
}

export function playerToTheRight(current: PlayerPosition): PlayerPosition {
  // "Right" from a player's perspective sitting at a table = next clockwise
  return nextPlayer(current);
}

export function getPartner(position: PlayerPosition): PlayerPosition {
  const partners: Record<PlayerPosition, PlayerPosition> = {
    south: 'north',
    north: 'south',
    east: 'west',
    west: 'east',
  };
  return partners[position];
}

export function getTeamForPlayer(
  position: PlayerPosition,
  teams: [Team, Team]
): Team {
  return teams.find((t) => t.positions.includes(position))!;
}
