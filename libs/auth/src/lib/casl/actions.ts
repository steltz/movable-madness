/**
 * CASL action definitions.
 * These are the verbs that can be performed on subjects.
 */
export const Actions = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage', // Meta-action meaning "any action"
} as const;

export type Action = (typeof Actions)[keyof typeof Actions];
