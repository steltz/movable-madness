import type { Team } from '@movable-madness/shared-types';
import { TeamSlot } from './team-slot';

interface MatchupProps {
  team1: Team | null;
  team2: Team | null;
  selectedTeamId: number | null;
  onSelectWinner: (teamId: number) => void;
  /** Hide connector on the last round (championship) */
  hideConnector?: boolean;
}

export function Matchup({
  team1,
  team2,
  selectedTeamId,
  onSelectWinner,
  hideConnector = false,
}: MatchupProps) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col gap-0.5 rounded-lg bg-muted/30 p-1">
        <TeamSlot
          team={team1}
          isSelected={team1 != null && selectedTeamId === team1.id}
          onClick={() => team1 && onSelectWinner(team1.id)}
        />
        <TeamSlot
          team={team2}
          isSelected={team2 != null && selectedTeamId === team2.id}
          onClick={() => team2 && onSelectWinner(team2.id)}
        />
      </div>
      {!hideConnector && (
        <div className="flex flex-col items-stretch" style={{ width: 16 }}>
          <div className="flex-1 border-t-2 border-r-2 border-border/50" />
          <div className="flex-1 border-b-2 border-r-2 border-border/50" />
        </div>
      )}
    </div>
  );
}
