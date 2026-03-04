import type { CreateBracketRequest } from '@movable-madness/shared-types';
import { useCallback, useState } from 'react';
import { post } from '../../../shared/api/api-client';
import { cascadeReset, getPickCount, TOTAL_PICKS } from '../lib/bracket-utils';
import { BracketRound } from './BracketRound';
import { SubmitFooter } from './SubmitFooter';

interface BracketGridProps {
  userId: string;
  bracketName: string;
}

export function BracketGrid({ userId, bracketName }: BracketGridProps) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectWinner = useCallback((matchupId: string, teamId: string) => {
    setPicks((prev) => {
      const oldWinnerId = prev[matchupId];

      if (oldWinnerId === teamId) {
        const newPicks = { ...prev };
        delete newPicks[matchupId];
        return cascadeReset(newPicks, matchupId, teamId);
      }

      let newPicks = { ...prev };

      if (oldWinnerId) {
        newPicks = cascadeReset(newPicks, matchupId, oldWinnerId);
      }

      newPicks[matchupId] = teamId;
      return newPicks;
    });
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (getPickCount(picks) < TOTAL_PICKS) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await post<{ id: string }>('/v1/brackets', {
        userId,
        bracketName,
        picks,
      } satisfies CreateBracketRequest);
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to submit bracket. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">Bracket Submitted!</h2>
          <p className="text-[#999]">Your bracket &quot;{bracketName}&quot; has been saved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-16">
      {submitError && (
        <div className="mx-4 mt-4 rounded border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {submitError}
        </div>
      )}

      <div className="overflow-x-auto px-4 pt-4">
        <div className="flex items-start gap-6" style={{ minWidth: '1800px' }}>
          {[1, 2, 3, 4].map((round) => (
            <BracketRound
              key={`left-${round}`}
              round={round}
              picks={picks}
              onSelectWinner={handleSelectWinner}
              side="left"
            />
          ))}

          <BracketRound round={5} picks={picks} onSelectWinner={handleSelectWinner} side="left" />
          <BracketRound round={6} picks={picks} onSelectWinner={handleSelectWinner} side="left" />

          {[4, 3, 2, 1].map((round) => (
            <BracketRound
              key={`right-${round}`}
              round={round}
              picks={picks}
              onSelectWinner={handleSelectWinner}
              side="right"
            />
          ))}
        </div>
      </div>

      <SubmitFooter
        pickCount={getPickCount(picks)}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
