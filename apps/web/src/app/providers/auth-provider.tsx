import type { AuthUser } from '@movable-madness/auth';
import type { BracketUserDocument } from '@movable-madness/shared-types';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { getBracketUserMe } from '../../features/bracket-auth';
import { getFirebaseAuth, initFirebase } from '../../shared/config/firebase';

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: User | null;
  bracketUser: BracketUserDocument | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  refreshBracketUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [bracketUser, setBracketUser] = useState<BracketUserDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBracketUser = useCallback(async () => {
    const profile = await getBracketUserMe();
    setBracketUser(profile);
  }, []);

  useEffect(() => {
    initFirebase();
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        if (fbUser.isAnonymous) {
          setUser(null);
          await fetchBracketUser();
        } else {
          try {
            const tokenResult = await fbUser.getIdTokenResult();
            const role = (tokenResult.claims.role as AuthUser['role']) ?? 'viewer';
            setUser({
              uid: fbUser.uid,
              email: fbUser.email ?? '',
              role,
            });
          } catch {
            setUser(null);
          }
          setBracketUser(null);
        }
      } else {
        setUser(null);
        setBracketUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchBracketUser]);

  const value: AuthContextValue = {
    user,
    firebaseUser,
    bracketUser,
    loading,
    isAuthenticated: user !== null || bracketUser !== null,
    isAnonymous: firebaseUser?.isAnonymous ?? false,
    refreshBracketUser: fetchBracketUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
