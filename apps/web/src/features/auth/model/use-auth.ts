import type { AuthUser } from '@workspace/auth';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFirebaseAuth } from '../../../shared/config/firebase';
import {
  signIn as firebaseSignIn,
  signOut as firebaseSignOut,
  getUserRole,
} from '../api/firebase-auth';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Listen for auth state changes
  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const role = await getUserRole();
          setState({
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              role: (role as AuthUser['role']) ?? 'admin',
            },
            loading: false,
            error: null,
          });
        } catch {
          setState({
            user: null,
            loading: false,
            error: 'Failed to get user role',
          });
        }
      } else {
        setState({
          user: null,
          loading: false,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await firebaseSignIn(email, password);
      // Auth state change listener will update the state
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await firebaseSignOut();
      // Auth state change listener will update the state
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      }));
      throw error;
    }
  }, []);

  const isAuthenticated = useMemo(() => state.user !== null, [state.user]);

  return {
    ...state,
    signIn,
    signOut,
    isAuthenticated,
  };
}
