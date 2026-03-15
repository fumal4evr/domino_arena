import {
  Rule,
  GameMove,
  GameState,
  RuleViolation,
  getPartner,
  isPassMove,
} from '../types';

/**
 * Soft rule: prefer not to cover your partner's last play.
 *
 * "Covering" means playing on the end where your partner just played,
 * effectively blocking the value they set up.
 *
 * This is a soft/advisory rule — AI will avoid it, but human players
 * get a warning rather than a block.
 */
export const dontCoverPartnerRule: Rule = {
  name: 'dont-cover-partner',
  severity: 'soft',
  evaluate(move: GameMove, state: GameState): RuleViolation | null {
    if (state.board.chain.length < 2) return null;

    const partner = getPartner(move.playerPosition);

    // Find partner's last action
    const partnerLastAction = [...state.turnHistory]
      .reverse()
      .find((a) => a.playerPosition === partner);

    if (!partnerLastAction || isPassMove(partnerLastAction)) return null;

    const partnerMove = partnerLastAction;

    // Check if this move plays on the same end partner last played
    if (move.end === partnerMove.end) {
      return {
        ruleName: this.name,
        message: `This covers your partner's last play on the ${move.end} end.`,
        severity: 'soft',
      };
    }

    return null;
  },
};

/** All partner-specific rules */
export const PARTNER_RULES: Rule[] = [dontCoverPartnerRule];
