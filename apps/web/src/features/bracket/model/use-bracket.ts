import type { BracketPicks, Team } from '@movable-madness/shared-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { submitBracket as apiSubmitBracket, fetchMyBracket } from '../api/bracket-api';
import {
  selectWinner as applySelectWinner,
  isComplete as checkIsComplete,
  countPicks,
  createEmptyPicks,
  generateRandomPicks,
  getMatchupTeams,
} from './bracket-utils';

interface UseBracketOptions {
  bracketName: string;
}

interface UseBracketReturn {
  picks: BracketPicks;
  selectWinner: (matchupId: string, teamId: number) => void;
  getTeams: (round: number, matchIndex: number) => [Team | null, Team | null];
  picksCount: number;
  isComplete: boolean;
  submitBracket: () => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  isSubmitted: boolean;
  isLoading: boolean;
  quickPick: () => void;
}

function convertStoredPicks(storedPicks: Record<string, string>): BracketPicks {
  const picks = createEmptyPicks();
  for (const [key, value] of Object.entries(storedPicks)) {
    if (key in picks) {
      const num = Number(value);
      picks[key] = Number.isNaN(num) ? null : num;
    }
  }
  return picks;
}

export function useBracket({ bracketName }: UseBracketOptions): UseBracketReturn {
  const [picks, setPicks] = useState<BracketPicks>(createEmptyPicks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchMyBracket()
      .then((response) => {
        if (!cancelled && response.data) {
          setPicks(convertStoredPicks(response.data.picks));
        }
      })
      .catch(() => {
        // 404 or network error — fall back to empty picks
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectWinner = useCallback((matchupId: string, teamId: number) => {
    setPicks((prev) => applySelectWinner(prev, matchupId, teamId));
  }, []);

  const getTeams = useCallback(
    (round: number, matchIndex: number): [Team | null, Team | null] => {
      return getMatchupTeams(round, matchIndex, picks);
    },
    [picks],
  );

  const picksCount = useMemo(() => countPicks(picks), [picks]);
  const isComplete = useMemo(() => checkIsComplete(picks), [picks]);

  const submitBracket = useCallback(async () => {
    if (!isComplete) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await apiSubmitBracket({ bracketName, picks });
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit bracket. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [bracketName, picks, isComplete]);

  const quickPick = useCallback(() => {
    setPicks(generateRandomPicks());
  }, []);

  return {
    picks,
    selectWinner,
    getTeams,
    picksCount,
    isComplete,
    submitBracket,
    isSubmitting,
    submitError,
    isSubmitted,
    isLoading,
    quickPick,
  };
}
