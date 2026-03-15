import { SetMetadata } from '@nestjs/common';
import type { Action, AppAbility, Subjects } from '@workspace/auth';

/**
 * Policy handler type - checks if ability allows the action.
 */
export type PolicyHandler = (ability: AppAbility) => boolean;

/**
 * Tuple format for simple policy checks: [action, subject]
 */
export type PolicyTuple = [Action, Subjects];

export const CHECK_POLICIES_KEY = 'check_policies';

/**
 * Decorator to define CASL policies for a route.
 * Requires PoliciesGuard to be applied.
 *
 * @example
 * ```typescript
 * // Using tuple format
 * @CheckPolicies([Actions.READ, 'User'])
 * getUsers() {}
 *
 * // Using handler function
 * @CheckPolicies((ability) => ability.can(Actions.MANAGE, 'all'))
 * adminOnly() {}
 * ```
 */
export const CheckPolicies = (...handlers: (PolicyHandler | PolicyTuple)[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
