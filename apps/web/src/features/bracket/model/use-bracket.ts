import type { BracketPicks, Team } from '@movable-madness/shared-types';
import { useCallback, useMemo, useState } from 'react';
import { submitBracket as apiSubmitBracket } from '../api/bracket-api';
import {
  selectWinner as applySelectWinner,
  isComplete as checkIsComplete,
  countPicks,
  createEmptyPicks,
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
}

export function useBracket({ bracketName }: UseBracketOptions): UseBracketReturn {
  const [picks, setPicks] = useState<BracketPicks>(createEmptyPicks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
  };
}
