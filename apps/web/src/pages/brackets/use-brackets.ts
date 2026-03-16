import type { BracketEntry } from '@movable-madness/shared-types';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getFirebaseDb } from '../../shared/config/firebase';

export interface BracketEntryWithId extends BracketEntry {
  id: string;
}

interface UseBracketsResult {
  entries: BracketEntryWithId[];
  loading: boolean;
  error: string | null;
}

export function useBrackets(): UseBracketsResult {
  const [entries, setEntries] = useState<BracketEntryWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDb();
    const bracketsQuery = query(collection(db, 'brackets'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      bracketsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as BracketEntry),
        }));
        setEntries(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { entries, loading, error };
}
