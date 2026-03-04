import type { MongoAbility } from '@casl/ability';
import type { Action } from './actions';

/**
 * Subjects that can be acted upon.
 * Add new subjects here as you add protected resources.
 */
export type Subjects = 'User' | 'all';

/**
 * Application ability type combining actions and subjects.
 * Used throughout the app for type-safe permission checks.
 */
export type AppAbility = MongoAbility<[Action, Subjects]>;
