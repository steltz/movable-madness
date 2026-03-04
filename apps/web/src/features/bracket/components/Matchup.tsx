import type { Team } from '@movable-madness/shared-types';
import { TeamSlot } from './TeamSlot';

interface MatchupProps {
  matchupId: string;
  teams: [Team | null, Team | null];
  selectedWinnerId: string | undefined;
  onSelectWinner: (matchupId: string, teamId: string) => void;
  showConnector?: boolean;
}

export function Matchup({
  matchupId,
  teams,
  selectedWinnerId,
  onSelectWinner,
  showConnector = true,
}: MatchupProps) {
  const [teamA, teamB] = teams;

  return (
    <div className="relative flex flex-col gap-0.5">
      <TeamSlot
        team={teamA}
        isSelected={selectedWinnerId === teamA?.id}
        isDisabled={!teamA}
        onClick={() => teamA && onSelectWinner(matchupId, teamA.id)}
      />
      <TeamSlot
        team={teamB}
        isSelected={selectedWinnerId === teamB?.id}
        isDisabled={!teamB}
        onClick={() => teamB && onSelectWinner(matchupId, teamB.id)}
      />
      {showConnector && <div className="absolute -right-3 top-1/2 h-px w-3 bg-[#333]" />}
    </div>
  );
}
