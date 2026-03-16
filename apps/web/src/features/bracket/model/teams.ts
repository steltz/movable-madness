import type { Team } from '@movable-madness/shared-types';

export const TEAMS: Team[] = [
  // East Region
  { id: 1, name: 'Duke', seed: 1, region: 'East' },
  { id: 2, name: 'Siena', seed: 16, region: 'East' },
  { id: 3, name: 'Ohio State', seed: 8, region: 'East' },
  { id: 4, name: 'TCU', seed: 9, region: 'East' },
  { id: 5, name: "St. John's", seed: 5, region: 'East' },
  { id: 6, name: 'Northern Iowa', seed: 12, region: 'East' },
  { id: 7, name: 'Kansas', seed: 4, region: 'East' },
  { id: 8, name: 'Cal Baptist', seed: 13, region: 'East' },
  { id: 9, name: 'Louisville', seed: 6, region: 'East' },
  { id: 10, name: 'South Florida', seed: 11, region: 'East' },
  { id: 11, name: 'Michigan State', seed: 3, region: 'East' },
  { id: 12, name: 'North Dakota State', seed: 14, region: 'East' },
  { id: 13, name: 'UCLA', seed: 7, region: 'East' },
  { id: 14, name: 'UCF', seed: 10, region: 'East' },
  { id: 15, name: 'UConn', seed: 2, region: 'East' },
  { id: 16, name: 'Furman', seed: 15, region: 'East' },

  // West Region
  { id: 17, name: 'Arizona', seed: 1, region: 'West' },
  { id: 18, name: 'LIU', seed: 16, region: 'West' },
  { id: 19, name: 'Villanova', seed: 8, region: 'West' },
  { id: 20, name: 'Utah State', seed: 9, region: 'West' },
  { id: 21, name: 'Wisconsin', seed: 5, region: 'West' },
  { id: 22, name: 'High Point', seed: 12, region: 'West' },
  { id: 23, name: 'Arkansas', seed: 4, region: 'West' },
  { id: 24, name: 'Hawaii', seed: 13, region: 'West' },
  { id: 25, name: 'BYU', seed: 6, region: 'West' },
  { id: 26, name: 'Texas / NC State', seed: 11, region: 'West' },
  { id: 27, name: 'Gonzaga', seed: 3, region: 'West' },
  { id: 28, name: 'Kennesaw State', seed: 14, region: 'West' },
  { id: 29, name: 'Miami (FL)', seed: 7, region: 'West' },
  { id: 30, name: 'Missouri', seed: 10, region: 'West' },
  { id: 31, name: 'Purdue', seed: 2, region: 'West' },
  { id: 32, name: 'Queens', seed: 15, region: 'West' },

  // South Region
  { id: 33, name: 'Florida', seed: 1, region: 'South' },
  { id: 34, name: 'Prairie View A&M / Lehigh', seed: 16, region: 'South' },
  { id: 35, name: 'Clemson', seed: 8, region: 'South' },
  { id: 36, name: 'Iowa', seed: 9, region: 'South' },
  { id: 37, name: 'Vanderbilt', seed: 5, region: 'South' },
  { id: 38, name: 'McNeese State', seed: 12, region: 'South' },
  { id: 39, name: 'Nebraska', seed: 4, region: 'South' },
  { id: 40, name: 'Troy', seed: 13, region: 'South' },
  { id: 41, name: 'North Carolina', seed: 6, region: 'South' },
  { id: 42, name: 'VCU', seed: 11, region: 'South' },
  { id: 43, name: 'Illinois', seed: 3, region: 'South' },
  { id: 44, name: 'Pennsylvania', seed: 14, region: 'South' },
  { id: 45, name: "Saint Mary's", seed: 7, region: 'South' },
  { id: 46, name: 'Texas A&M', seed: 10, region: 'South' },
  { id: 47, name: 'Houston', seed: 2, region: 'South' },
  { id: 48, name: 'Idaho', seed: 15, region: 'South' },

  // Midwest Region
  { id: 49, name: 'Michigan', seed: 1, region: 'Midwest' },
  { id: 50, name: 'UMBC / Howard', seed: 16, region: 'Midwest' },
  { id: 51, name: 'Georgia', seed: 8, region: 'Midwest' },
  { id: 52, name: 'St. Louis', seed: 9, region: 'Midwest' },
  { id: 53, name: 'Texas Tech', seed: 5, region: 'Midwest' },
  { id: 54, name: 'Akron', seed: 12, region: 'Midwest' },
  { id: 55, name: 'Alabama', seed: 4, region: 'Midwest' },
  { id: 56, name: 'Hofstra', seed: 13, region: 'Midwest' },
  { id: 57, name: 'Tennessee', seed: 6, region: 'Midwest' },
  { id: 58, name: 'Miami (OH) / SMU', seed: 11, region: 'Midwest' },
  { id: 59, name: 'Virginia', seed: 3, region: 'Midwest' },
  { id: 60, name: 'Wright State', seed: 14, region: 'Midwest' },
  { id: 61, name: 'Kentucky', seed: 7, region: 'Midwest' },
  { id: 62, name: 'Santa Clara', seed: 10, region: 'Midwest' },
  { id: 63, name: 'Iowa State', seed: 2, region: 'Midwest' },
  { id: 64, name: 'Tennessee State', seed: 15, region: 'Midwest' },
];

/**
 * Standard NCAA bracket seeding matchup order.
 * Each pair of indices into a region's 16 teams forms a first-round matchup.
 * Teams are ordered in the TEAMS array as: seed 1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15
 * This produces matchups: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
 */
export const ROUND_LABELS = [
  'Round 1',
  'Round 2',
  'Sweet 16',
  'Elite 8',
  'Final Four',
  'Championship',
] as const;

export const TOTAL_ROUNDS = 6;
export const TOTAL_MATCHUPS = 63;
