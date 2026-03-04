import { describe, expect, it } from 'vitest';
import { TEAMS } from '../data/teams';
import {
  cascadeReset,
  getFeederMatchupIds,
  getMatchupId,
  getMatchupTeams,
  getPickCount,
  getRoundMatchupCount,
  TOTAL_PICKS,
  TOTAL_ROUNDS,
} from './bracket-utils';

describe('bracket-utils', () => {
  describe('constants', () => {
    it('has 6 total rounds', () => {
      expect(TOTAL_ROUNDS).toBe(6);
    });

    it('has 63 total picks', () => {
      expect(TOTAL_PICKS).toBe(63);
    });
  });

  describe('getMatchupId', () => {
    it('generates correct matchup ID', () => {
      expect(getMatchupId(1, 1)).toBe('R1-M1');
      expect(getMatchupId(3, 5)).toBe('R3-M5');
    });
  });

  describe('getRoundMatchupCount', () => {
    it('returns 32 for round 1', () => {
      expect(getRoundMatchupCount(1)).toBe(32);
    });

    it('returns 1 for round 6 (championship)', () => {
      expect(getRoundMatchupCount(6)).toBe(1);
    });

    it('halves each round', () => {
      expect(getRoundMatchupCount(2)).toBe(16);
      expect(getRoundMatchupCount(3)).toBe(8);
      expect(getRoundMatchupCount(4)).toBe(4);
      expect(getRoundMatchupCount(5)).toBe(2);
    });
  });

  describe('getFeederMatchupIds', () => {
    it('returns undefined for round 1 (no feeders)', () => {
      expect(getFeederMatchupIds(1, 1)).toBeUndefined();
    });

    it('returns correct feeders for round 2', () => {
      expect(getFeederMatchupIds(2, 1)).toEqual(['R1-M1', 'R1-M2']);
      expect(getFeederMatchupIds(2, 3)).toEqual(['R1-M5', 'R1-M6']);
    });

    it('returns correct feeders for round 3', () => {
      expect(getFeederMatchupIds(3, 1)).toEqual(['R2-M1', 'R2-M2']);
    });

    it('returns correct feeders for championship', () => {
      expect(getFeederMatchupIds(6, 1)).toEqual(['R5-M1', 'R5-M2']);
    });
  });

  describe('getMatchupTeams', () => {
    it('returns teams for round 1 matchup from teams array', () => {
      const result = getMatchupTeams(1, 1, TEAMS, {});
      expect(result).toEqual([TEAMS[0], TEAMS[1]]);
    });

    it('returns correct teams for round 1 matchup 3', () => {
      const result = getMatchupTeams(1, 3, TEAMS, {});
      expect(result).toEqual([TEAMS[4], TEAMS[5]]);
    });

    it('returns winners from feeder matchups for round 2', () => {
      const picks = { 'R1-M1': 'team-1', 'R1-M2': 'team-4' };
      const result = getMatchupTeams(2, 1, TEAMS, picks);
      expect(result).toEqual([TEAMS[0], TEAMS[3]]);
    });

    it('returns null for missing feeder winners', () => {
      const result = getMatchupTeams(2, 1, TEAMS, {});
      expect(result).toEqual([null, null]);
    });

    it('returns partial teams when one feeder is picked', () => {
      const picks = { 'R1-M1': 'team-1' };
      const result = getMatchupTeams(2, 1, TEAMS, picks);
      expect(result).toEqual([TEAMS[0], null]);
    });
  });

  describe('cascadeReset', () => {
    it('clears downstream picks when changing a round 1 pick', () => {
      const picks: Record<string, string> = {
        'R1-M1': 'team-1',
        'R1-M2': 'team-4',
        'R2-M1': 'team-1',
        'R3-M1': 'team-1',
      };
      const result = cascadeReset(picks, 'R1-M1', 'team-1');
      expect(result['R2-M1']).toBeUndefined();
      expect(result['R3-M1']).toBeUndefined();
      expect(result['R1-M2']).toBe('team-4');
    });

    it('returns picks unchanged if old winner was not advanced', () => {
      const picks: Record<string, string> = {
        'R1-M1': 'team-1',
        'R1-M2': 'team-4',
      };
      const result = cascadeReset(picks, 'R1-M1', 'team-1');
      expect(result['R1-M2']).toBe('team-4');
    });

    it('handles cascade across multiple rounds', () => {
      const picks: Record<string, string> = {
        'R1-M1': 'team-1',
        'R1-M2': 'team-4',
        'R2-M1': 'team-1',
        'R3-M1': 'team-1',
        'R4-M1': 'team-1',
      };
      const result = cascadeReset(picks, 'R1-M1', 'team-1');
      expect(result['R2-M1']).toBeUndefined();
      expect(result['R3-M1']).toBeUndefined();
      expect(result['R4-M1']).toBeUndefined();
    });
  });

  describe('getPickCount', () => {
    it('returns 0 for empty picks', () => {
      expect(getPickCount({})).toBe(0);
    });

    it('returns correct count', () => {
      expect(getPickCount({ 'R1-M1': 'team-1', 'R1-M2': 'team-4' })).toBe(2);
    });
  });
});
