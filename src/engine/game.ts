import {
  GameState,
  GamePhase,
  Player,
  PlayerPosition,
  Team,
  TURN_ORDER,
  nextPlayer,
  playerToTheRight,
  GameMove,
  TurnAction,
  PassMove,
  RoundResult,
  getTeamForPlayer,
  isPassMove,
} from './types';
import { createBoard, placeTile, hasValidMove, getAllValidMoves } from './board';
import { dealTiles, findDoubleSixHolder, handPipCount } from './tile';
import { RuleEngine } from './rules';
import { BASE_RULES } from './rules/base-rules';
import { PARTNER_RULES } from './rules/partner-rules';
import { AIStrategy, basicAI } from './ai';

const WINNING_SCORE = 100;

/** Create initial players */
function createPlayers(
  hands: Record<PlayerPosition, import('./types').Tile[]>
): Record<PlayerPosition, Player> {
  return {
    south: { position: 'south', name: 'You', hand: hands.south, isHuman: true },
    east: { position: 'east', name: 'East', hand: hands.east, isHuman: false },
    north: {
      position: 'north',
      name: 'Partner',
      hand: hands.north,
      isHuman: false,
    },
    west: { position: 'west', name: 'West', hand: hands.west, isHuman: false },
  };
}

/** Create the two teams */
function createTeams(existingTeams?: [Team, Team]): [Team, Team] {
  if (existingTeams) {
    return [
      { ...existingTeams[0], positions: ['south', 'north'] },
      { ...existingTeams[1], positions: ['east', 'west'] },
    ];
  }
  return [
    { name: 'You & Partner', positions: ['south', 'north'], score: 0 },
    { name: 'East & West', positions: ['east', 'west'], score: 0 },
  ];
}

/** Initialize a brand new game */
export function initGame(): GameState {
  const hands = dealTiles();
  const players = createPlayers(hands);
  const starter = findDoubleSixHolder(players) ?? 'south';

  return {
    players,
    teams: createTeams(),
    board: createBoard(),
    currentPlayer: starter,
    phase: 'playing',
    round: 1,
    roundStarter: starter,
    turnHistory: [],
    roundResults: [],
    winner: null,
  };
}

/** Start a new round, keeping scores */
export function startNewRound(prevState: GameState): GameState {
  const hands = dealTiles();
  const players = createPlayers(hands);
  const nextStarter = playerToTheRight(prevState.roundStarter);

  return {
    players,
    teams: createTeams(prevState.teams),
    board: createBoard(),
    currentPlayer: nextStarter,
    phase: 'playing',
    round: prevState.round + 1,
    roundStarter: nextStarter,
    turnHistory: [],
    roundResults: prevState.roundResults,
    winner: null,
  };
}

/** Execute a move: place a tile, remove from hand, advance turn */
export function executeMove(
  state: GameState,
  move: GameMove
): GameState {
  const player = state.players[move.playerPosition];

  // Remove the tile from the player's hand
  const newHand = player.hand.filter((t) => t.id !== move.tile.id);
  const newPlayers = {
    ...state.players,
    [move.playerPosition]: { ...player, hand: newHand },
  };

  // Place tile on board
  const newBoard = placeTile(state.board, move);

  const newHistory: TurnAction[] = [...state.turnHistory, move];

  let newState: GameState = {
    ...state,
    players: newPlayers,
    board: newBoard,
    turnHistory: newHistory,
  };

  // Check if the player emptied their hand → round over
  if (newHand.length === 0) {
    return resolveRoundEnd(newState, move.playerPosition);
  }

  // Advance to next player (skip players with no valid moves)
  newState = advanceToNextPlayer(newState);
  return newState;
}

/** Execute a pass */
export function executePass(state: GameState): GameState {
  const passAction: PassMove = {
    playerPosition: state.currentPlayer,
    pass: true,
  };
  const newHistory: TurnAction[] = [...state.turnHistory, passAction];

  const newState: GameState = {
    ...state,
    turnHistory: newHistory,
  };

  return advanceToNextPlayer(newState);
}

/** Advance to the next player. If all players are blocked, end the round. */
function advanceToNextPlayer(state: GameState): GameState {
  let candidate = nextPlayer(state.currentPlayer);
  let checkedCount = 0;
  let currentState = state;

  while (checkedCount < 4) {
    if (hasValidMove(currentState.players[candidate].hand, currentState.board)) {
      return { ...currentState, currentPlayer: candidate };
    }

    // Record a pass for this skipped player
    const passAction: PassMove = {
      playerPosition: candidate,
      pass: true,
    };
    currentState = {
      ...currentState,
      turnHistory: [...currentState.turnHistory, passAction],
    };

    candidate = nextPlayer(candidate);
    checkedCount++;
  }

  // All 4 players are blocked → round is locked
  return resolveRoundEnd(currentState, null);
}

/**
 * Resolve round end.
 * @param winner - position of the player who went out, or null if blocked
 */
function resolveRoundEnd(
  state: GameState,
  winner: PlayerPosition | null
): GameState {
  const teams = state.teams.map((t) => ({ ...t })) as [Team, Team];
  let points: number;
  let winningTeamName: string;
  let blocked = false;

  if (winner) {
    // Player went out — opposing team gets their own remaining pips as penalty
    const winnerTeam = getTeamForPlayer(winner, teams);
    const loserTeam = teams.find((t) => t !== winnerTeam)!;

    points = loserTeam.positions.reduce(
      (sum, pos) => sum + handPipCount(state.players[pos].hand),
      0
    );
    loserTeam.score += points;
    winningTeamName = winnerTeam.name;
  } else {
    // Blocked — each team gets their own remaining pips as penalty
    blocked = true;
    const teamPips = teams.map((t) => ({
      team: t,
      pips: t.positions.reduce(
        (sum, pos) => sum + handPipCount(state.players[pos].hand),
        0
      ),
    }));

    for (const tp of teamPips) {
      tp.team.score += tp.pips;
    }

    const [a, b] = teamPips;
    points = a.pips + b.pips;
    if (a.pips < b.pips) {
      winningTeamName = a.team.name;
    } else if (b.pips < a.pips) {
      winningTeamName = b.team.name;
    } else {
      winningTeamName = 'Tie';
    }
  }

  const roundResult: RoundResult = {
    winningTeam: winningTeamName,
    points,
    blocked,
  };

  // Check if game is over — first team to reach 100 loses
  const loser = teams.find((t) => t.score >= WINNING_SCORE);
  const gameWinner = loser ? teams.find((t) => t !== loser)! : null;

  return {
    ...state,
    teams,
    phase: gameWinner ? 'game_over' : 'round_over',
    roundResults: [...state.roundResults, roundResult],
    winner: gameWinner ? gameWinner.name : null,
  };
}

/** Create the default rule engine with base + partner rules */
export function createGameRuleEngine(): RuleEngine {
  const engine = new RuleEngine();
  engine.registerMany(BASE_RULES);
  engine.registerMany(PARTNER_RULES);
  return engine;
}

/** Get valid moves for the current player, filtered by rules */
export function getValidMovesForCurrentPlayer(
  state: GameState,
  rules: RuleEngine
): GameMove[] {
  const player = state.players[state.currentPlayer];
  const allMoves = getAllValidMoves(
    player.hand,
    state.board,
    state.currentPlayer
  );
  // Filter out hard-rule violations only
  return allMoves.filter((move) => !rules.hasHardViolation(move, state));
}

/** Check if the current player must pass */
export function mustPass(state: GameState, rules: RuleEngine): boolean {
  return getValidMovesForCurrentPlayer(state, rules).length === 0;
}

/** Let AI choose and execute a move */
export function executeAITurn(
  state: GameState,
  rules: RuleEngine,
  strategy: AIStrategy = basicAI
): GameState {
  const player = state.players[state.currentPlayer];
  const move = strategy.chooseMove(player.hand, state, rules);

  if (!move) {
    return executePass(state);
  }

  return executeMove(state, move);
}
