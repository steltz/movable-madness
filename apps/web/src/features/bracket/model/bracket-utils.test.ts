import { describe, expect, it } from 'vitest';
import {
  countPicks,
  createEmptyPicks,
  getFeederMatchupIds,
  getFirstRoundTeams,
  getMatchupTeams,
  isComplete,
  matchupId,
  matchupsInRound,
  parseMatchupId,
  selectWinner,
} from './bracket-utils';

describe('matchupId', () => {
  it('generates correct ID format', () => {
    expect(matchupId(1, 0)).toBe('R1_M0');
    expect(matchupId(3, 5)).toBe('R3_M5');
  });
});

describe('parseMatchupId', () => {
  it('parses a valid matchup ID', () => {
    expect(parseMatchupId('R1_M0')).toEqual({ round: 1, matchIndex: 0 });
    expect(parseMatchupId('R6_M0')).toEqual({ round: 6, matchIndex: 0 });
  });

  it('throws on invalid ID', () => {
    expect(() => parseMatchupId('invalid')).toThrow('Invalid matchup ID');
  });
});

describe('matchupsInRound', () => {
  it('returns correct count per round', () => {
    expect(matchupsInRound(1)).toBe(32);
    expect(matchupsInRound(2)).toBe(16);
    expect(matchupsInRound(3)).toBe(8);
    expect(matchupsInRound(4)).toBe(4);
    expect(matchupsInRound(5)).toBe(2);
    expect(matchupsInRound(6)).toBe(1);
  });
});

describe('getFeederMatchupIds', () => {
  it('returns correct feeder IDs for round 2', () => {
    expect(getFeederMatchupIds(2, 0)).toEqual(['R1_M0', 'R1_M1']);
    expect(getFeederMatchupIds(2, 3)).toEqual(['R1_M6', 'R1_M7']);
  });

  it('throws for round 1', () => {
    expect(() => getFeederMatchupIds(1, 0)).toThrow('Round 1 has no feeders');
  });
});

describe('getFirstRoundTeams', () => {
  it('returns two teams for matchup 0 (East 1 vs 16)', () => {
    const [team1, team2] = getFirstRoundTeams(0);
    expect(team1.seed).toBe(1);
    expect(team2.seed).toBe(16);
    expect(team1.region).toBe('East');
    expect(team2.region).toBe('East');
  });

  it('returns two teams for matchup 8 (West 1 vs 16)', () => {
    const [team1, team2] = getFirstRoundTeams(8);
    expect(team1.seed).toBe(1);
    expect(team2.seed).toBe(16);
    expect(team1.region).toBe('West');
    expect(team2.region).toBe('West');
  });
});

describe('createEmptyPicks', () => {
  it('creates 63 null picks', () => {
    const picks = createEmptyPicks();
    const entries = Object.entries(picks);
    expect(entries).toHaveLength(63);
    expect(entries.every(([, v]) => v === null)).toBe(true);
  });

  it('has 32 round-1 matchups', () => {
    const picks = createEmptyPicks();
    const r1 = Object.keys(picks).filter((k) => k.startsWith('R1_'));
    expect(r1).toHaveLength(32);
  });
});

describe('getMatchupTeams', () => {
  it('returns hardcoded teams for round 1', () => {
    const picks = createEmptyPicks();
    const [t1, t2] = getMatchupTeams(1, 0, picks);
    expect(t1).not.toBeNull();
    expect(t2).not.toBeNull();
  });

  it('returns nulls for round 2 when feeders not picked', () => {
    const picks = createEmptyPicks();
    const [t1, t2] = getMatchupTeams(2, 0, picks);
    expect(t1).toBeNull();
    expect(t2).toBeNull();
  });

  it('returns teams for round 2 when feeders are picked', () => {
    let picks = createEmptyPicks();
    const [team1] = getFirstRoundTeams(0);
    const [team3] = getFirstRoundTeams(1);
    picks = selectWinner(picks, 'R1_M0', team1.id);
    picks = selectWinner(picks, 'R1_M1', team3.id);
    const [t1, t2] = getMatchupTeams(2, 0, picks);
    expect(t1?.id).toBe(team1.id);
    expect(t2?.id).toBe(team3.id);
  });
});

describe('selectWinner', () => {
  it('sets the pick for a matchup', () => {
    const picks = createEmptyPicks();
    const [team1] = getFirstRoundTeams(0);
    const result = selectWinner(picks, 'R1_M0', team1.id);
    expect(result.R1_M0).toBe(team1.id);
  });

  it('returns same object for same pick (no-op)', () => {
    let picks = createEmptyPicks();
    const [team1] = getFirstRoundTeams(0);
    picks = selectWinner(picks, 'R1_M0', team1.id);
    const result = selectWinner(picks, 'R1_M0', team1.id);
    expect(result).toBe(picks);
  });

  it('cascades clears when changing a pick', () => {
    let picks = createEmptyPicks();
    const [team1, team2] = getFirstRoundTeams(0);
    const [team3] = getFirstRoundTeams(1);

    picks = selectWinner(picks, 'R1_M0', team1.id);
    picks = selectWinner(picks, 'R1_M1', team3.id);
    picks = selectWinner(picks, 'R2_M0', team1.id);
    expect(picks.R2_M0).toBe(team1.id);

    picks = selectWinner(picks, 'R1_M0', team2.id);
    expect(picks.R1_M0).toBe(team2.id);
    expect(picks.R2_M0).toBeNull();
  });

  it('cascade clears multiple rounds deep', () => {
    let picks = createEmptyPicks();
    const [team1] = getFirstRoundTeams(0);
    const [, team2] = getFirstRoundTeams(0);
    const [team3] = getFirstRoundTeams(1);
    const [team5] = getFirstRoundTeams(2);
    const [team7] = getFirstRoundTeams(3);

    picks = selectWinner(picks, 'R1_M0', team1.id);
    picks = selectWinner(picks, 'R1_M1', team3.id);
    picks = selectWinner(picks, 'R2_M0', team1.id);
    picks = selectWinner(picks, 'R1_M2', team5.id);
    picks = selectWinner(picks, 'R1_M3', team7.id);
    picks = selectWinner(picks, 'R2_M1', team5.id);
    picks = selectWinner(picks, 'R3_M0', team1.id);

    picks = selectWinner(picks, 'R1_M0', team2.id);
    expect(picks.R2_M0).toBeNull();
    expect(picks.R3_M0).toBeNull();
  });
});

describe('countPicks / isComplete', () => {
  it('counts zero for empty picks', () => {
    expect(countPicks(createEmptyPicks())).toBe(0);
    expect(isComplete(createEmptyPicks())).toBe(false);
  });

  it('counts correctly after picks', () => {
    let picks = createEmptyPicks();
    const [team1] = getFirstRoundTeams(0);
    picks = selectWinner(picks, 'R1_M0', team1.id);
    expect(countPicks(picks)).toBe(1);
  });
});
