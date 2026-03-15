import type { BracketPicks, Team } from '@movable-madness/shared-types';
import { matchupId, matchupsInRound } from '../model/bracket-utils';
import { ROUND_LABELS, TOTAL_ROUNDS } from '../model/teams';
import { Matchup } from './matchup';

interface BracketRoundProps {
  round: number;
  picks: BracketPicks;
  getTeams: (round: number, matchIndex: number) => [Team | null, Team | null];
  onSelectWinner: (matchupId: string, teamId: number) => void;
}

export function BracketRound({ round, picks, getTeams, onSelectWinner }: BracketRoundProps) {
  const count = matchupsInRound(round);
  const label = ROUND_LABELS[round - 1];
  const isLastRound = round === TOTAL_ROUNDS;

  return (
    <div className="flex shrink-0 flex-col gap-1" style={{ minWidth: 180 }}>
      <div className="mb-1 rounded-md bg-muted/50 px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-1 flex-col" style={{ justifyContent: 'space-around' }}>
        {Array.from({ length: count }, (_, i) => {
          const id = matchupId(round, i);
          const [team1, team2] = getTeams(round, i);
          return (
            <Matchup
              key={id}
              team1={team1}
              team2={team2}
              selectedTeamId={picks[id]}
              onSelectWinner={(teamId) => onSelectWinner(id, teamId)}
              hideConnector={isLastRound}
            />
          );
        })}
      </div>
    </div>
  );
}
