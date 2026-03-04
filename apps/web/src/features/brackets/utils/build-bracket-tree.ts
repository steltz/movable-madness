import type { Matchup, Round } from '@movable-madness/shared-types';

const ROUND_LABELS = [
  'Round of 64',
  'Round of 32',
  'Sweet 16',
  'Elite 8',
  'Final Four',
  'Championship',
];

export function buildBracketTree(teams: string[], picks: Record<string, string>): Round[] {
  const rounds: Round[] = [];

  // Round 1: pair teams from the seed list
  const round1Matchups: Matchup[] = [];
  for (let i = 0; i < 32; i++) {
    const id = `R1_M${i + 1}`;
    round1Matchups.push({
      id,
      teamA: teams[i * 2] ?? null,
      teamB: teams[i * 2 + 1] ?? null,
      winner: picks[id] ?? null,
    });
  }
  rounds.push({ label: ROUND_LABELS[0], matchups: round1Matchups });

  // Rounds 2-6: derive from previous round winners
  let prevMatchups = round1Matchups;
  for (let round = 2; round <= 6; round++) {
    const matchups: Matchup[] = [];
    const matchupCount = prevMatchups.length / 2;

    for (let i = 0; i < matchupCount; i++) {
      const id = `R${round}_M${i + 1}`;
      const feedA = prevMatchups[i * 2];
      const feedB = prevMatchups[i * 2 + 1];

      matchups.push({
        id,
        teamA: feedA.winner,
        teamB: feedB.winner,
        winner: picks[id] ?? null,
      });
    }

    rounds.push({ label: ROUND_LABELS[round - 1], matchups });
    prevMatchups = matchups;
  }

  return rounds;
}
