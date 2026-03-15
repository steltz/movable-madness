import type { BracketPicks, Team } from '@movable-madness/shared-types';
import { TOTAL_ROUNDS } from '../model/teams';
import { BracketRound } from './bracket-round';

interface BracketGridProps {
  picks: BracketPicks;
  getTeams: (round: number, matchIndex: number) => [Team | null, Team | null];
  onSelectWinner: (matchupId: string, teamId: number) => void;
}

export function BracketGrid({ picks, getTeams, onSelectWinner }: BracketGridProps) {
  return (
    <div className="flex gap-2 overflow-x-auto p-4 pb-24">
      {Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
        const round = i + 1;
        return (
          <BracketRound
            key={round}
            round={round}
            picks={picks}
            getTeams={getTeams}
            onSelectWinner={onSelectWinner}
          />
        );
      })}
    </div>
  );
}
