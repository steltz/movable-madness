import { Roles } from '../types/roles';
import type { AuthUser } from '../types/user';
import { createAbilityForUser, createEmptyAbility } from './ability.factory';
import { Actions } from './actions';

describe('CaslAbilityFactory', () => {
  describe('createAbilityForUser', () => {
    describe('admin role', () => {
      const adminUser: AuthUser = {
        uid: 'admin-uid-123',
        email: 'admin@admin.com',
        role: Roles.ADMIN,
      };

      it('should allow manage action on all subjects', () => {
        const ability = createAbilityForUser(adminUser);
        expect(ability.can(Actions.MANAGE, 'all')).toBe(true);
      });

      it('should allow read action on User', () => {
        const ability = createAbilityForUser(adminUser);
        expect(ability.can(Actions.READ, 'User')).toBe(true);
      });

      it('should allow create action on User', () => {
        const ability = createAbilityForUser(adminUser);
        expect(ability.can(Actions.CREATE, 'User')).toBe(true);
      });

      it('should allow update action on User', () => {
        const ability = createAbilityForUser(adminUser);
        expect(ability.can(Actions.UPDATE, 'User')).toBe(true);
      });

      it('should allow delete action on User', () => {
        const ability = createAbilityForUser(adminUser);
        expect(ability.can(Actions.DELETE, 'User')).toBe(true);
      });
    });

    describe('unrecognized role', () => {
      const unknownUser: AuthUser = {
        uid: 'unknown-uid',
        email: 'unknown@example.com',
        role: 'unknown' as AuthUser['role'],
      };

      it('should deny all actions (default deny)', () => {
        const ability = createAbilityForUser(unknownUser);
        expect(ability.can(Actions.READ, 'User')).toBe(false);
        expect(ability.can(Actions.CREATE, 'User')).toBe(false);
        expect(ability.can(Actions.UPDATE, 'User')).toBe(false);
        expect(ability.can(Actions.DELETE, 'User')).toBe(false);
        expect(ability.can(Actions.MANAGE, 'all')).toBe(false);
      });
    });
  });

  describe('createEmptyAbility', () => {
    it('should deny all actions', () => {
      const ability = createEmptyAbility();
      expect(ability.can(Actions.READ, 'User')).toBe(false);
      expect(ability.can(Actions.CREATE, 'User')).toBe(false);
      expect(ability.can(Actions.UPDATE, 'User')).toBe(false);
      expect(ability.can(Actions.DELETE, 'User')).toBe(false);
      expect(ability.can(Actions.MANAGE, 'all')).toBe(false);
    });
  });
});
