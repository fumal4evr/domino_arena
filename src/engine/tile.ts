import { Tile, PipValue, Player, PlayerPosition, TURN_ORDER } from './types';

/** Create all 28 tiles in a double-six set */
export function createTileSet(): Tile[] {
  const tiles: Tile[] = [];
  for (let left = 0; left <= 6; left++) {
    for (let right = left; right <= 6; right++) {
      tiles.push({
        left: left as PipValue,
        right: right as PipValue,
        id: `${left}|${right}`,
      });
    }
  }
  return tiles;
}

/** Fisher-Yates shuffle */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Shuffle tiles and deal 7 to each of 4 players */
export function dealTiles(): Record<PlayerPosition, Tile[]> {
  const tiles = shuffle(createTileSet());
  const hands: Record<PlayerPosition, Tile[]> = {
    south: [],
    east: [],
    north: [],
    west: [],
  };
  TURN_ORDER.forEach((pos, i) => {
    hands[pos] = tiles.slice(i * 7, (i + 1) * 7);
  });
  return hands;
}

/** Check if a tile is a double */
export function isDouble(tile: Tile): boolean {
  return tile.left === tile.right;
}

/** Total pip count of a tile */
export function pipCount(tile: Tile): number {
  return tile.left + tile.right;
}

/** Sum of all pips in a hand */
export function handPipCount(hand: Tile[]): number {
  return hand.reduce((sum, t) => sum + pipCount(t), 0);
}

/** Check if a tile can connect to a given open value */
export function canConnect(tile: Tile, openValue: PipValue): boolean {
  return tile.left === openValue || tile.right === openValue;
}

/** Find who holds double-6, or null if no one does (shouldn't happen) */
export function findDoubleSixHolder(
  players: Record<PlayerPosition, Player>
): PlayerPosition | null {
  for (const pos of TURN_ORDER) {
    if (players[pos].hand.some((t) => t.left === 6 && t.right === 6)) {
      return pos;
    }
  }
  return null;
}
