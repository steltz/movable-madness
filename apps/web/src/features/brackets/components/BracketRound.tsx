import type { Matchup } from '@movable-madness/shared-types';
import { MatchupCard } from './MatchupCard';

interface BracketRoundProps {
  name: string;
  matchups: Matchup[];
  roundIndex: number;
  isChampionship: boolean;
}

export function BracketRound({ name, matchups, roundIndex, isChampionship }: BracketRoundProps) {
  const topOffset = roundIndex === 0 ? 0 : Math.round(30 * (2 ** roundIndex - 1) * 0.5);

  return (
    <div className="flex shrink-0 basis-40 flex-col gap-2" style={{ marginTop: topOffset }}>
      <div className="text-center text-[11px] font-semibold uppercase tracking-wide text-brand">
        {name}
      </div>
      {matchups.map((matchup) => (
        <MatchupCard key={matchup.key} matchup={matchup} isChampionship={isChampionship} />
      ))}
    </div>
  );
}
