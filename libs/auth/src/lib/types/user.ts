import type { Role } from './roles';

/**
 * Authenticated user extracted from Firebase ID token.
 * Used across API and web app for auth context.
 */
export interface AuthUser {
  uid: string;
  email?: string;
  role: Role;
}

/**
 * Firestore user document structure at /users/{uid}.
 * Contains profile data and denormalized role.
 */
export interface UserDocument {
  email: string;
  role: Role;
  displayName?: string;
  createdAt: Date;
  updatedAt?: Date;
}
