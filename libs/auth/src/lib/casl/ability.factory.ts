import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { Roles } from '../types/roles';
import type { AuthUser } from '../types/user';
import { Actions } from './actions';
import type { AppAbility } from './types';

/**
 * Creates CASL ability based on user's role.
 *
 * To extend with a new role:
 * 1. Add the role to Roles constant in types/roles.ts
 * 2. Add a case for the new role below with permission rules
 *
 * Example for adding an "editor" role:
 * ```typescript
 * case Roles.EDITOR:
 *   can(Actions.READ, 'all');
 *   can(Actions.UPDATE, 'Post');
 *   can(Actions.CREATE, 'Post');
 *   break;
 * ```
 */
export function createAbilityForUser(user: AuthUser): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  switch (user.role) {
    case Roles.ADMIN:
      // Admin has full access to everything
      can(Actions.MANAGE, 'all');
      break;

    default:
      // Unrecognized roles get no permissions (default deny)
      break;
  }

  return build();
}

/**
 * Creates an empty ability with no permissions.
 * Used when there is no authenticated user.
 */
export function createEmptyAbility(): AppAbility {
  const { build } = new AbilityBuilder<AppAbility>(createMongoAbility);
  return build();
}
