import { deriveBracketMatchups, ROUND_NAMES } from '../utils/derive-bracket-matchups';
import { BracketRound } from './BracketRound';

interface BracketGridProps {
  teams: string[];
  picks: Record<string, string>;
}

export function BracketGrid({ teams, picks }: BracketGridProps) {
  const rounds = deriveBracketMatchups(teams, picks);
  const champion = rounds[5]?.[0]?.winner ?? null;

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[1100px] gap-0 px-4 py-6">
        {rounds.map((matchups, i) => (
          <div key={ROUND_NAMES[i]} className="flex flex-col">
            <BracketRound
              name={ROUND_NAMES[i]}
              matchups={matchups}
              roundIndex={i}
              isChampionship={i === 5}
            />
            {i === 5 && (
              <div className="mt-3 text-center">
                <div className="text-[10px] uppercase tracking-wide text-gray-400">Champion</div>
                <div
                  className={`mt-1 rounded-lg border-2 border-dashed px-3 py-2 text-base font-bold ${
                    champion
                      ? 'border-[#E31C79] bg-pink-50 text-[#E31C79]'
                      : 'border-gray-300 bg-gray-50 text-gray-400 italic'
                  }`}
                >
                  {champion ?? 'TBD'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
