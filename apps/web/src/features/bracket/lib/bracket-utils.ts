import type { Team } from '@movable-madness/shared-types';

export const TOTAL_ROUNDS = 6;
export const TOTAL_PICKS = 63;

export function getMatchupId(round: number, matchup: number): string {
  return `R${round}-M${matchup}`;
}

export function getRoundMatchupCount(round: number): number {
  return 32 / 2 ** (round - 1);
}

export function getFeederMatchupIds(round: number, matchup: number): [string, string] | undefined {
  if (round === 1) return undefined;
  const feeder1 = getMatchupId(round - 1, matchup * 2 - 1);
  const feeder2 = getMatchupId(round - 1, matchup * 2);
  return [feeder1, feeder2];
}

export function getMatchupTeams(
  round: number,
  matchup: number,
  teams: Team[],
  picks: Record<string, string>,
): [Team | null, Team | null] {
  if (round === 1) {
    const idx = (matchup - 1) * 2;
    return [teams[idx], teams[idx + 1]];
  }

  const feeders = getFeederMatchupIds(round, matchup);
  if (!feeders) return [null, null];

  const [feeder1Id, feeder2Id] = feeders;
  const winner1Id = picks[feeder1Id];
  const winner2Id = picks[feeder2Id];

  const team1 = winner1Id ? (teams.find((t) => t.id === winner1Id) ?? null) : null;
  const team2 = winner2Id ? (teams.find((t) => t.id === winner2Id) ?? null) : null;

  return [team1, team2];
}

/**
 * Removes all picks that reference the old winner from downstream matchups.
 * Excludes `changedMatchupId` from the output — the caller must re-add it
 * with the new selection (or omit it for deselection).
 */
export function cascadeReset(
  picks: Record<string, string>,
  changedMatchupId: string,
  oldWinnerId: string,
): Record<string, string> {
  const newPicks: Record<string, string> = {};

  for (const [matchupId, winnerId] of Object.entries(picks)) {
    if (matchupId === changedMatchupId) continue;
    if (winnerId === oldWinnerId) continue;
    newPicks[matchupId] = winnerId;
  }

  return newPicks;
}

export function getPickCount(picks: Record<string, string>): number {
  return Object.keys(picks).length;
}
