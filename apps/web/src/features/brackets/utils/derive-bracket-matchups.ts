import type { Matchup } from '@movable-madness/shared-types';

export const ROUND_NAMES = [
  'Round of 64',
  'Round of 32',
  'Sweet 16',
  'Elite 8',
  'Final Four',
  'Championship',
] as const;

const REGION_SEEDS = [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15];

function getSeed(teamIndex: number): number {
  return REGION_SEEDS[teamIndex % 16];
}

export function deriveBracketMatchups(teams: string[], picks: Record<string, string>): Matchup[][] {
  const rounds: Matchup[][] = [];

  const teamIndexMap = new Map<string, number>();
  for (let i = 0; i < teams.length; i++) {
    teamIndexMap.set(teams[i], i);
  }

  const round1: Matchup[] = [];
  for (let m = 0; m < 32; m++) {
    const key = `R1_M${m + 1}`;
    const topTeam = teams[m * 2] ?? null;
    const bottomTeam = teams[m * 2 + 1] ?? null;
    const winner = picks[key] ?? null;

    round1.push({
      key,
      topTeam,
      bottomTeam,
      winner,
      topSeed: topTeam != null ? getSeed(m * 2) : undefined,
      bottomSeed: bottomTeam != null ? getSeed(m * 2 + 1) : undefined,
    });
  }
  rounds.push(round1);

  const matchupsPerRound = [32, 16, 8, 4, 2, 1];
  for (let r = 1; r < 6; r++) {
    const count = matchupsPerRound[r];
    const prevRound = rounds[r - 1];
    const currentRound: Matchup[] = [];

    for (let m = 0; m < count; m++) {
      const key = `R${r + 1}_M${m + 1}`;
      const topParent = prevRound[m * 2];
      const bottomParent = prevRound[m * 2 + 1];

      const topTeam = topParent?.winner ?? null;
      const bottomTeam = bottomParent?.winner ?? null;
      const winner = picks[key] ?? null;

      const topSeed =
        topTeam != null && teamIndexMap.has(topTeam)
          ? getSeed(teamIndexMap.get(topTeam)!)
          : undefined;
      const bottomSeed =
        bottomTeam != null && teamIndexMap.has(bottomTeam)
          ? getSeed(teamIndexMap.get(bottomTeam)!)
          : undefined;

      currentRound.push({
        key,
        topTeam,
        bottomTeam,
        winner,
        topSeed,
        bottomSeed,
      });
    }
    rounds.push(currentRound);
  }

  return rounds;
}
