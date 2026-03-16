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
        className={`px-2.5 py-1.5 text-xs text-muted-foreground italic${
          isTop ? '' : ' border-t border-dashed border-border'
        }`}
      >
        TBD
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1.5 text-xs${
        isTop ? '' : ' border-t border-border'
      }${isWinner ? '' : ' text-muted-foreground'}`}
    >
      <span>
        {seed != null && <span className="mr-1 text-[10px] text-muted-foreground">({seed})</span>}
        {team}
      </span>
      {isWinner && <span className="font-semibold text-brand">&#10003;</span>}
    </div>
  );
}

export function MatchupCard({ matchup, isChampionship = false }: MatchupCardProps) {
  const hasAnyTeam = matchup.topTeam != null || matchup.bottomTeam != null;
  const borderClass = isChampionship
    ? 'border-2 border-brand rounded-lg'
    : hasAnyTeam
      ? 'border border-border rounded-md'
      : 'border border-dashed border-border rounded-md';

  return (
    <div className={`bg-card overflow-hidden ${borderClass}`}>
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
