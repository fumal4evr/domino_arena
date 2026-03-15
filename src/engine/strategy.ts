import { PipValue, PlayerPosition, GameState, TURN_ORDER } from './types';
import { analyzeHand } from './coach';
import { handPipCount } from './tile';
import type { Tile } from './types';

// ─── Strong Suit ───

/**
 * Compute a player's strong suit from their initial hand.
 * Returns the pip value(s) with the highest frequency (min count 2).
 * If multiple values tie for the top count, all are returned.
 */
export function computeStrongSuit(hand: Tile[]): PipValue[] {
  const dist = analyzeHand(hand).distribution;
  const entries = (Object.entries(dist) as [string, number][])
    .map(([pip, count]) => ({ pip: Number(pip) as PipValue, count }))
    .filter((e) => e.count >= 2)
    .sort((a, b) => b.count - a.count);

  if (entries.length === 0) return [];

  const topCount = entries[0].count;
  return entries.filter((e) => e.count === topCount).map((e) => e.pip);
}

/**
 * Compute strong suits for all four players from their current hands.
 * Called once at round start before any tiles are played.
 */
export function computeAllStrongSuits(
  players: GameState['players'],
): Record<PlayerPosition, PipValue[]> {
  return {
    south: computeStrongSuit(players.south.hand),
    east: computeStrongSuit(players.east.hand),
    north: computeStrongSuit(players.north.hand),
    west: computeStrongSuit(players.west.hand),
  };
}

// ─── Lead / Runt ───

/**
 * Return players sorted by lead order: fewest tiles first (lead),
 * most tiles last (runt). Ties broken by fewer pips.
 */
export function computeLeadOrder(state: GameState): PlayerPosition[] {
  return [...TURN_ORDER].sort((a, b) => {
    const sizeA = state.players[a].hand.length;
    const sizeB = state.players[b].hand.length;
    if (sizeA !== sizeB) return sizeA - sizeB;
    return handPipCount(state.players[a].hand) - handPipCount(state.players[b].hand);
  });
}

/**
 * Check if a player is a lead (in the top half of lead order)
 * or a runt (in the bottom half).
 */
export function isLead(pos: PlayerPosition, state: GameState): boolean {
  const order = computeLeadOrder(state);
  const idx = order.indexOf(pos);
  return idx <= 1; // top 2 of 4
}
