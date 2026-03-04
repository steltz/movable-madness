import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getFirebaseFirestore } from '../../../shared/config/firebase';
import type { BracketEntry } from '../model/bracket.types';

interface UseBracketsListenerResult {
  brackets: BracketEntry[];
  loading: boolean;
  error: string | null;
}

export function useBracketsListener(): UseBracketsListenerResult {
  const [brackets, setBrackets] = useState<BracketEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseFirestore();
    const bracketsQuery = query(collection(db, 'brackets'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      bracketsQuery,
      (snapshot) => {
        const entries: BracketEntry[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            bracketName: data.bracketName,
            userId: data.userId,
            status: data.status,
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
          };
        });
        setBrackets(entries);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Brackets listener error:', err);
        setError('Failed to load brackets. Please try again.');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { brackets, loading, error };
}
