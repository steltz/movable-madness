import type { Matchup } from '@movable-madness/shared-types';

interface MatchupCardProps {
  matchup: Matchup;
  isChampionship?: boolean;
}

function TeamRow({
  team,
  seed,
  isWinner,
  isTop,
}: {
  team: string | null;
  seed?: number;
  isWinner: boolean;
  isTop: boolean;
}) {
  if (team == null) {
    return (
      <div
        className={`px-2.5 py-1.5 text-xs text-gray-400 italic${
          isTop ? '' : ' border-t border-dashed border-gray-200'
        }`}
      >
        TBD
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1.5 text-xs${
        isTop ? '' : ' border-t border-gray-200'
      }${isWinner ? '' : ' text-gray-400'}`}
    >
      <span>
        {seed != null && <span className="mr-1 text-[10px] text-gray-400">({seed})</span>}
        {team}
      </span>
      {isWinner && <span className="font-semibold text-[#E31C79]">&#10003;</span>}
    </div>
  );
}

export function MatchupCard({ matchup, isChampionship = false }: MatchupCardProps) {
  const hasAnyTeam = matchup.topTeam != null || matchup.bottomTeam != null;
  const borderClass = isChampionship
    ? 'border-2 border-[#E31C79] rounded-lg'
    : hasAnyTeam
      ? 'border border-gray-300 rounded-md'
      : 'border border-dashed border-gray-300 rounded-md';

  return (
    <div className={`bg-white overflow-hidden ${borderClass}`}>
      <TeamRow
        team={matchup.topTeam}
        seed={matchup.topSeed}
        isWinner={matchup.winner === matchup.topTeam && matchup.topTeam != null}
        isTop={true}
      />
      <TeamRow
        team={matchup.bottomTeam}
        seed={matchup.bottomSeed}
        isWinner={matchup.winner === matchup.bottomTeam && matchup.bottomTeam != null}
        isTop={false}
      />
    </div>
  );
}
