import {
  BoardState,
  BoardEnd,
  GameMove,
  Tile,
  PipValue,
  GameState,
} from './types';
import { canConnect } from './tile';

/** Create an empty board */
export function createBoard(): BoardState {
  return {
    chain: [],
    leftOpen: null,
    rightOpen: null,
  };
}

/** Determine which ends of the board a tile can be played on */
export function getValidPlacements(
  tile: Tile,
  board: BoardState
): BoardEnd[] {
  // Empty board: can play on either end (treated as 'right' for first tile)
  if (board.chain.length === 0) {
    return ['right'];
  }

  const ends: BoardEnd[] = [];
  if (board.leftOpen !== null && canConnect(tile, board.leftOpen)) {
    ends.push('left');
  }
  if (board.rightOpen !== null && canConnect(tile, board.rightOpen)) {
    ends.push('right');
  }

  // If both ends have the same value, only return one option to avoid duplication
  if (
    ends.length === 2 &&
    board.leftOpen === board.rightOpen &&
    tile.left === tile.right
  ) {
    return ['left'];
  }

  return ends;
}

/** Check if a player has any valid move */
export function hasValidMove(hand: Tile[], board: BoardState): boolean {
  return hand.some((tile) => getValidPlacements(tile, board).length > 0);
}

/** Get all valid moves for a player's hand */
export function getAllValidMoves(
  hand: Tile[],
  board: BoardState,
  playerPosition: GameState['currentPlayer']
): GameMove[] {
  const moves: GameMove[] = [];
  for (const tile of hand) {
    for (const end of getValidPlacements(tile, board)) {
      moves.push({ playerPosition, tile, end });
    }
  }
  return moves;
}

/** Place a tile on the board, returning the new board state */
export function placeTile(board: BoardState, move: GameMove): BoardState {
  const { tile, end } = move;
  const newChain = [...board.chain];

  if (newChain.length === 0) {
    // First tile
    newChain.push({
      tile,
      openValue: tile.left, // left side faces left
      placedAt: 'right',
    });
    return {
      chain: newChain,
      leftOpen: tile.left,
      rightOpen: tile.right,
    };
  }

  if (end === 'left') {
    const connectValue = board.leftOpen!;
    // Determine which side of the tile connects
    const openValue: PipValue =
      tile.right === connectValue ? tile.left : tile.right;
    newChain.unshift({ tile, openValue, placedAt: 'left' });
    return {
      chain: newChain,
      leftOpen: openValue,
      rightOpen: board.rightOpen,
    };
  } else {
    const connectValue = board.rightOpen!;
    const openValue: PipValue =
      tile.left === connectValue ? tile.right : tile.left;
    newChain.push({ tile, openValue, placedAt: 'right' });
    return {
      chain: newChain,
      leftOpen: board.leftOpen,
      rightOpen: openValue,
    };
  }
}
