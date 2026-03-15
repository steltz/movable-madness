import { describe, expect, it } from 'vitest';
import { deriveBracketMatchups, ROUND_NAMES } from './derive-bracket-matchups';

// 64 sample teams in bracket matchup order (adjacent pairs = R1 matchups)
// Region 1 (indexes 0-15): 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
// Regions 2-4 follow the same pattern
function makeTeams(): string[] {
  const teams: string[] = [];
  for (let i = 1; i <= 64; i++) {
    teams.push(`Team ${i}`);
  }
  return teams;
}

// Picks for a fully completed bracket (all 63 matchups)
function makeFullPicks(teams: string[]): Record<string, string> {
  const picks: Record<string, string> = {};
  // R1: 32 matchups — pick the first team (top) in each
  for (let m = 1; m <= 32; m++) {
    picks[`R1_M${m}`] = teams[(m - 1) * 2]; // top team wins
  }
  // R2: 16 matchups — winners of R1 pairs
  for (let m = 1; m <= 16; m++) {
    picks[`R2_M${m}`] = picks[`R1_M${(m - 1) * 2 + 1}`]!;
  }
  // R3: 8 matchups
  for (let m = 1; m <= 8; m++) {
    picks[`R3_M${m}`] = picks[`R2_M${(m - 1) * 2 + 1}`]!;
  }
  // R4: 4 matchups
  for (let m = 1; m <= 4; m++) {
    picks[`R4_M${m}`] = picks[`R3_M${(m - 1) * 2 + 1}`]!;
  }
  // R5: 2 matchups
  for (let m = 1; m <= 2; m++) {
    picks[`R5_M${m}`] = picks[`R4_M${(m - 1) * 2 + 1}`]!;
  }
  // R6: championship
  picks['R6_M1'] = picks['R5_M1']!;
  return picks;
}

describe('deriveBracketMatchups', () => {
  it('returns 6 rounds with correct matchup counts', () => {
    const teams = makeTeams();
    const picks = makeFullPicks(teams);
    const rounds = deriveBracketMatchups(teams, picks);

    expect(rounds).toHaveLength(6);
    expect(rounds[0]).toHaveLength(32);
    expect(rounds[1]).toHaveLength(16);
    expect(rounds[2]).toHaveLength(8);
    expect(rounds[3]).toHaveLength(4);
    expect(rounds[4]).toHaveLength(2);
    expect(rounds[5]).toHaveLength(1);
  });

  it('correctly assigns R1 matchup teams from the teams array', () => {
    const teams = makeTeams();
    const rounds = deriveBracketMatchups(teams, {});

    // First matchup: teams[0] vs teams[1]
    expect(rounds[0][0].topTeam).toBe('Team 1');
    expect(rounds[0][0].bottomTeam).toBe('Team 2');
    expect(rounds[0][0].key).toBe('R1_M1');

    // Second matchup: teams[2] vs teams[3]
    expect(rounds[0][1].topTeam).toBe('Team 3');
    expect(rounds[0][1].bottomTeam).toBe('Team 4');
    expect(rounds[0][1].key).toBe('R1_M2');

    // Last matchup: teams[62] vs teams[63]
    expect(rounds[0][31].topTeam).toBe('Team 63');
    expect(rounds[0][31].bottomTeam).toBe('Team 64');
    expect(rounds[0][31].key).toBe('R1_M32');
  });

  it('sets winner from picks in R1', () => {
    const teams = makeTeams();
    const picks: Record<string, string> = { R1_M1: 'Team 1' };
    const rounds = deriveBracketMatchups(teams, picks);

    expect(rounds[0][0].winner).toBe('Team 1');
    expect(rounds[0][1].winner).toBeNull(); // no pick for M2
  });

  it('propagates winners to later rounds', () => {
    const teams = makeTeams();
    const picks: Record<string, string> = {
      R1_M1: 'Team 1',
      R1_M2: 'Team 3',
      R2_M1: 'Team 1',
    };
    const rounds = deriveBracketMatchups(teams, picks);

    // R2_M1 should have winners of R1_M1 and R1_M2
    expect(rounds[1][0].topTeam).toBe('Team 1');
    expect(rounds[1][0].bottomTeam).toBe('Team 3');
    expect(rounds[1][0].winner).toBe('Team 1');
  });

  it('shows null teams in later rounds when prior picks are missing', () => {
    const teams = makeTeams();
    const rounds = deriveBracketMatchups(teams, {}); // no picks at all

    // R2 teams should all be null since no R1 winners exist
    expect(rounds[1][0].topTeam).toBeNull();
    expect(rounds[1][0].bottomTeam).toBeNull();
  });

  it('assigns seed numbers in R1', () => {
    const teams = makeTeams();
    const rounds = deriveBracketMatchups(teams, {});

    // Seeds come from SEEDS_BY_INDEX constant
    expect(rounds[0][0].topSeed).toBeDefined();
    expect(rounds[0][0].bottomSeed).toBeDefined();
    expect(typeof rounds[0][0].topSeed).toBe('number');
  });

  it('tracks seeds through later rounds', () => {
    const teams = makeTeams();
    const picks: Record<string, string> = {
      R1_M1: 'Team 1',
      R1_M2: 'Team 3',
      R2_M1: 'Team 1',
    };
    const rounds = deriveBracketMatchups(teams, picks);

    // R2_M1 top team is Team 1, which was at index 0 in teams[]
    // Its seed should match SEEDS_BY_INDEX[0]
    expect(rounds[1][0].topSeed).toBeDefined();
  });

  it('handles a fully completed bracket', () => {
    const teams = makeTeams();
    const picks = makeFullPicks(teams);
    const rounds = deriveBracketMatchups(teams, picks);

    // Championship should have a winner
    expect(rounds[5][0].winner).toBeTruthy();
    // Every R1 matchup should have a winner
    for (const matchup of rounds[0]) {
      expect(matchup.winner).toBeTruthy();
    }
  });

  it('handles empty picks gracefully', () => {
    const teams = makeTeams();
    const rounds = deriveBracketMatchups(teams, {});

    // R1 still has teams
    expect(rounds[0][0].topTeam).toBe('Team 1');
    // But no winners
    expect(rounds[0][0].winner).toBeNull();
    // Later rounds have null teams
    expect(rounds[1][0].topTeam).toBeNull();
  });
});

describe('ROUND_NAMES', () => {
  it('has 6 round names', () => {
    expect(ROUND_NAMES).toHaveLength(6);
    expect(ROUND_NAMES[0]).toBe('Round of 64');
    expect(ROUND_NAMES[5]).toBe('Championship');
  });
});
