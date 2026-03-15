import { Rule, RuleViolation, GameMove, GameState } from '../types';

export class RuleEngine {
  private rules: Rule[] = [];

  register(rule: Rule): void {
    this.rules.push(rule);
  }

  registerMany(rules: Rule[]): void {
    this.rules.push(...rules);
  }

  /** Evaluate a move against all rules. Returns list of violations (empty = OK) */
  evaluate(move: GameMove, state: GameState): RuleViolation[] {
    const violations: RuleViolation[] = [];
    for (const rule of this.rules) {
      const violation = rule.evaluate(move, state);
      if (violation) {
        violations.push(violation);
      }
    }
    return violations;
  }

  /** Check if a move has any hard-rule violations */
  hasHardViolation(move: GameMove, state: GameState): boolean {
    return this.evaluate(move, state).some((v) => v.severity === 'hard');
  }

  /** Get only soft-rule violations (warnings) */
  getSoftViolations(move: GameMove, state: GameState): RuleViolation[] {
    return this.evaluate(move, state).filter((v) => v.severity === 'soft');
  }

  getRules(): Rule[] {
    return [...this.rules];
  }
}

export function createDefaultRuleEngine(): RuleEngine {
  const engine = new RuleEngine();
  // Base rules are imported and registered by the game setup
  return engine;
}
