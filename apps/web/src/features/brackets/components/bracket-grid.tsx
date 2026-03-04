import type { Round } from '@movable-madness/shared-types';
import { BracketRound } from './bracket-round';
import './connector-lines.css';

interface BracketGridProps {
  rounds: Round[];
}

export function BracketGrid({ rounds }: BracketGridProps) {
  return (
    <div className="overflow-x-auto p-6">
      <div className="inline-flex items-stretch gap-4 min-h-[1200px]">
        {rounds.map((round, index) => (
          <div key={round.label} className="bracket-round-col">
            <BracketRound round={round} roundIndex={index} />
          </div>
        ))}
      </div>
    </div>
  );
}
