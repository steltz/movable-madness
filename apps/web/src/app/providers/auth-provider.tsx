import type { AuthUser } from '@movable-madness/auth';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth, getFirebaseDb, initFirebase } from '../../shared/config/firebase';

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  bracketName: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [bracketName, setBracketName] = useState<string | null>(null);

  useEffect(() => {
    initFirebase();
    const auth = getFirebaseAuth();

    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Clean up previous Firestore listener
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      setFirebaseUser(fbUser);

      if (fbUser) {
        const anonymous = fbUser.isAnonymous;
        setIsAnonymous(anonymous);

        if (anonymous) {
          setUser({
            uid: fbUser.uid,
            role: 'bracket_user',
          });

          // Attach Firestore real-time listener for bracket name
          const db = getFirebaseDb();
          const docRef = doc(db, 'bracketEntries', fbUser.uid);
          unsubscribeSnapshot = onSnapshot(
            docRef,
            (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                setBracketName(data.bracketName ?? null);
              } else {
                setBracketName(null);
              }
            },
            (error) => {
              console.error('Firestore bracketEntries listener error:', error);
            },
          );
        } else {
          try {
            const tokenResult = await fbUser.getIdTokenResult();
            const role = (tokenResult.claims.role as AuthUser['role']) ?? 'admin';
            setUser({
              uid: fbUser.uid,
              email: fbUser.email ?? '',
              role,
            });
          } catch {
            setUser(null);
          }
          setBracketName(null);
        }
      } else {
        setUser(null);
        setIsAnonymous(false);
        setBracketName(null);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const value: AuthContextValue = {
    user,
    firebaseUser,
    loading,
    isAuthenticated: user !== null,
    isAnonymous,
    bracketName,
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
