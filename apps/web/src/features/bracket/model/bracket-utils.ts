import type { BracketPicks, Team } from '@movable-madness/shared-types';
import { TEAMS, TOTAL_MATCHUPS } from './teams';

/**
 * Generate a matchup ID from round and matchup index.
 * Example: round 1, matchup 0 → "R1_M0"
 */
export function matchupId(round: number, matchIndex: number): string {
  return `R${round}_M${matchIndex}`;
}

/**
 * Parse a matchup ID into its round and matchup index.
 */
export function parseMatchupId(id: string): { round: number; matchIndex: number } {
  const match = id.match(/^R(\d+)_M(\d+)$/);
  if (!match) throw new Error(`Invalid matchup ID: ${id}`);
  return { round: Number(match[1]), matchIndex: Number(match[2]) };
}

/**
 * Get the number of matchups in a given round.
 * Round 1: 32, Round 2: 16, ..., Round 6: 1
 */
export function matchupsInRound(round: number): number {
  return 32 / 2 ** (round - 1);
}

/**
 * Get the two feeder matchup IDs for a given matchup in rounds 2+.
 * Matchup M in round R is fed by matchups 2*M and 2*M+1 in round R-1.
 */
export function getFeederMatchupIds(round: number, matchIndex: number): [string, string] {
  if (round <= 1) throw new Error('Round 1 has no feeders');
  return [matchupId(round - 1, matchIndex * 2), matchupId(round - 1, matchIndex * 2 + 1)];
}

/**
 * Get the two teams for a first-round matchup.
 * Teams are arranged in the TEAMS array as pairs within each region:
 * indices 0-15 = East, 16-31 = West, 32-47 = South, 48-63 = Midwest.
 * Within each region, teams are paired: (0,1), (2,3), (4,5), ...
 * Matchup index 0-7 = East, 8-15 = West, 16-23 = South, 24-31 = Midwest.
 */
export function getFirstRoundTeams(matchIndex: number): [Team, Team] {
  const teamIndex = matchIndex * 2;
  return [TEAMS[teamIndex], TEAMS[teamIndex + 1]];
}

/**
 * Get the two teams for any matchup, given the current picks.
 * For round 1, returns the hardcoded teams.
 * For later rounds, derives teams from feeder matchup winners.
 * Returns null for a slot if the feeder pick hasn't been made.
 */
export function getMatchupTeams(
  round: number,
  matchIndex: number,
  picks: BracketPicks,
): [Team | null, Team | null] {
  if (round === 1) {
    return getFirstRoundTeams(matchIndex);
  }

  const [feeder1, feeder2] = getFeederMatchupIds(round, matchIndex);
  const team1Id = picks[feeder1];
  const team2Id = picks[feeder2];

  return [
    team1Id != null ? (TEAMS.find((t) => t.id === team1Id) ?? null) : null,
    team2Id != null ? (TEAMS.find((t) => t.id === team2Id) ?? null) : null,
  ];
}

/**
 * Initialize an empty picks object with all 63 matchup slots set to null.
 */
export function createEmptyPicks(): BracketPicks {
  const picks: BracketPicks = {};
  for (let round = 1; round <= 6; round++) {
    const count = matchupsInRound(round);
    for (let i = 0; i < count; i++) {
      picks[matchupId(round, i)] = null;
    }
  }
  return picks;
}

/**
 * Select a winner for a matchup and cascade-clear any downstream picks
 * that depended on a different team previously occupying that slot.
 *
 * Returns a new picks object (immutable update).
 */
export function selectWinner(picks: BracketPicks, id: string, teamId: number): BracketPicks {
  const { round, matchIndex } = parseMatchupId(id);
  const previousPick = picks[id];

  // If same team already selected, no-op
  if (previousPick === teamId) return picks;

  const newPicks = { ...picks, [id]: teamId };

  // Cascade: clear downstream picks that included the old winner
  if (previousPick != null) {
    clearDownstream(newPicks, round, matchIndex, previousPick);
  }

  return newPicks;
}

/**
 * Recursively clear downstream picks that included a specific team.
 * Mutates the picks object for efficiency (called on a fresh copy).
 */
function clearDownstream(
  picks: BracketPicks,
  fromRound: number,
  fromMatchIndex: number,
  clearedTeamId: number,
): void {
  const nextRound = fromRound + 1;
  if (nextRound > 6) return;

  const nextMatchIndex = Math.floor(fromMatchIndex / 2);
  const nextId = matchupId(nextRound, nextMatchIndex);

  if (picks[nextId] === clearedTeamId) {
    picks[nextId] = null;
    // Continue clearing further downstream
    clearDownstream(picks, nextRound, nextMatchIndex, clearedTeamId);
  }
}

/**
 * Count how many picks have been made (non-null values).
 */
export function countPicks(picks: BracketPicks): number {
  return Object.values(picks).filter((v) => v != null).length;
}

/**
 * Check if all 63 picks have been made.
 */
export function isComplete(picks: BracketPicks): boolean {
  return countPicks(picks) === TOTAL_MATCHUPS;
}

/**
 * Generate a complete bracket with random picks (50/50 coin flip per matchup).
 * Iterates round-by-round so later rounds can reference earlier winners.
 */
export function generateRandomPicks(): BracketPicks {
  const picks: BracketPicks = {};

  for (let round = 1; round <= 6; round++) {
    const count = matchupsInRound(round);
    for (let i = 0; i < count; i++) {
      if (round === 1) {
        const [team1, team2] = getFirstRoundTeams(i);
        picks[matchupId(round, i)] = Math.random() < 0.5 ? team1.id : team2.id;
      } else {
        const [feeder1, feeder2] = getFeederMatchupIds(round, i);
        // Feeder matchups are guaranteed to be filled from previous rounds
        const team1Id = picks[feeder1] as number;
        const team2Id = picks[feeder2] as number;
        picks[matchupId(round, i)] = Math.random() < 0.5 ? team1Id : team2Id;
      }
    }
  }

  return picks;
}
