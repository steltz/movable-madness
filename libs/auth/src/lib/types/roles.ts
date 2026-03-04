/**
 * Role definitions for RBAC.
 *
 * To add a new role:
 * 1. Add the role key and value to the Roles constant
 * 2. Add permission rules in ability.factory.ts for the new role
 *
 * Example:
 * ```typescript
 * export const Roles = {
 *   ADMIN: 'admin',
 *   EDITOR: 'editor',  // Add new role here
 * } as const;
 * ```
 */
export const Roles = {
  ADMIN: 'admin',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
