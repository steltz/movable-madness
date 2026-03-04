import type { Team } from '@movable-madness/shared-types';
import { TEAMS } from '../data/teams';
import { getMatchupId, getMatchupTeams, getRoundMatchupCount } from '../lib/bracket-utils';
import { Matchup } from './Matchup';

const ROUND_LABELS: Record<number, string> = {
  1: 'Round of 64',
  2: 'Round of 32',
  3: 'Sweet 16',
  4: 'Elite 8',
  5: 'Final Four',
  6: 'Championship',
};

interface BracketRoundProps {
  round: number;
  picks: Record<string, string>;
  onSelectWinner: (matchupId: string, teamId: string) => void;
  side: 'left' | 'right';
}

export function BracketRound({ round, picks, onSelectWinner, side }: BracketRoundProps) {
  const totalMatchups = getRoundMatchupCount(round);

  let startMatchup: number;
  let endMatchup: number;

  if (round <= 4) {
    const halfCount = totalMatchups / 2;
    if (side === 'left') {
      startMatchup = 1;
      endMatchup = halfCount;
    } else {
      startMatchup = halfCount + 1;
      endMatchup = totalMatchups;
    }
  } else {
    startMatchup = 1;
    endMatchup = totalMatchups;
  }

  const matchups: { id: string; teams: [Team | null, Team | null] }[] = [];
  for (let m = startMatchup; m <= endMatchup; m++) {
    const id = getMatchupId(round, m);
    const teams = getMatchupTeams(round, m, TEAMS, picks);
    matchups.push({ id, teams });
  }

  return (
    <div className="flex flex-col items-center">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#999]">
        {ROUND_LABELS[round] ?? `Round ${round}`}
      </h3>
      <div className="flex flex-col justify-around gap-4" style={{ flex: 1 }}>
        {matchups.map((matchup) => (
          <Matchup
            key={matchup.id}
            matchupId={matchup.id}
            teams={matchup.teams}
            selectedWinnerId={picks[matchup.id]}
            onSelectWinner={onSelectWinner}
          />
        ))}
      </div>
    </div>
  );
}
