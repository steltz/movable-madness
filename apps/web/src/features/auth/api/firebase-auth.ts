import {
  type Auth,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '../../../shared/config/firebase';

/**
 * Signs in a user with email and password.
 */
export async function signIn(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Signs out the current user.
 */
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

/**
 * Signs in a user anonymously for bracket tournament access.
 */
export async function signInAnonymously(): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await firebaseSignInAnonymously(auth);
  return credential.user;
}

/**
 * Gets the ID token for the current user.
 * Returns null if no user is signed in.
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  return user.getIdToken(forceRefresh);
}

/**
 * Gets the current user's role from custom claims.
 */
export async function getUserRole(): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  const tokenResult = await user.getIdTokenResult();
  return (tokenResult.claims.role as string) ?? null;
}

/**
 * Gets the Firebase Auth instance.
 */
export function getAuth(): Auth {
  return getFirebaseAuth();
}
