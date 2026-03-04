import type { Round } from '@movable-madness/shared-types';
import { MatchupCard } from './matchup-card';

interface BracketRoundProps {
  round: Round;
  roundIndex: number;
}

export function BracketRound({ round, roundIndex }: BracketRoundProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {round.label}
      </div>
      <div
        className="flex flex-col justify-around flex-1"
        style={{ gap: `${2 ** roundIndex * 0.5}rem` }}
      >
        {round.matchups.map((matchup) => (
          <div key={matchup.id} className="bracket-matchup-wrapper">
            <MatchupCard matchup={matchup} />
          </div>
        ))}
      </div>
    </div>
  );
}
