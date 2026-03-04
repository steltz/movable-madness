import type { Matchup } from '@movable-madness/shared-types';
import { cn } from '@movable-madness/ui';

interface MatchupCardProps {
  matchup: Matchup;
}

function TeamRow({ name, isWinner }: { name: string | null; isWinner: boolean }) {
  if (!name) {
    return <div className="px-3 py-1.5 text-sm italic text-gray-400">TBD</div>;
  }

  return (
    <div
      className={cn(
        'px-3 py-1.5 text-sm truncate',
        isWinner ? 'bg-[#E31C79]/10 font-semibold text-[#E31C79]' : 'text-gray-500',
      )}
    >
      {name}
    </div>
  );
}

export function MatchupCard({ matchup }: MatchupCardProps) {
  return (
    <div className="w-44 rounded-lg border border-gray-300 bg-white overflow-hidden">
      <TeamRow
        name={matchup.teamA}
        isWinner={!!matchup.winner && matchup.winner === matchup.teamA}
      />
      <div className="border-t border-gray-300" />
      <TeamRow
        name={matchup.teamB}
        isWinner={!!matchup.winner && matchup.winner === matchup.teamB}
      />
    </div>
  );
}
