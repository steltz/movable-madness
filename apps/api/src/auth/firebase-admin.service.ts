import type { AuthUser } from '@movable-madness/auth';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { type DecodedIdToken, getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAdminService {
  constructor() {
    // Initialize Firebase Admin SDK if not already initialized
    if (getApps().length === 0) {
      initializeApp({
        credential: applicationDefault(),
      });
    }
  }

  /**
   * Verifies a Firebase ID token and returns the decoded payload.
   * Throws UnauthorizedException if the token is invalid.
   */
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    try {
      return await getAuth().verifyIdToken(idToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extracts AuthUser from a decoded Firebase ID token.
   */
  extractUser(decodedToken: DecodedIdToken): AuthUser {
    const isAnonymous = decodedToken.firebase?.sign_in_provider === 'anonymous';
    const defaultRole = isAnonymous ? 'bracket_user' : 'admin';

    return {
      uid: decodedToken.uid,
      email: decodedToken.email ?? '',
      role: (decodedToken.role as AuthUser['role']) ?? defaultRole,
    };
  }
}
