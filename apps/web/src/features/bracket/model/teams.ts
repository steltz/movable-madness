import type { Team } from '@movable-madness/shared-types';

export const TEAMS: Team[] = [
  // East Region
  { id: 1, name: 'Duke', seed: 1, region: 'East' },
  { id: 2, name: 'Vermont', seed: 16, region: 'East' },
  { id: 3, name: 'Tennessee', seed: 8, region: 'East' },
  { id: 4, name: 'Drake', seed: 9, region: 'East' },
  { id: 5, name: 'Purdue', seed: 5, region: 'East' },
  { id: 6, name: 'High Point', seed: 12, region: 'East' },
  { id: 7, name: 'Clemson', seed: 4, region: 'East' },
  { id: 8, name: 'Iona', seed: 13, region: 'East' },
  { id: 9, name: 'Creighton', seed: 6, region: 'East' },
  { id: 10, name: 'UC San Diego', seed: 11, region: 'East' },
  { id: 11, name: 'Illinois', seed: 3, region: 'East' },
  { id: 12, name: 'Troy', seed: 14, region: 'East' },
  { id: 13, name: 'Kentucky', seed: 7, region: 'East' },
  { id: 14, name: 'Lipscomb', seed: 10, region: 'East' },
  { id: 15, name: 'Arizona', seed: 2, region: 'East' },
  { id: 16, name: 'Norfolk St', seed: 15, region: 'East' },

  // West Region
  { id: 17, name: 'Florida', seed: 1, region: 'West' },
  { id: 18, name: 'FGCU', seed: 16, region: 'West' },
  { id: 19, name: 'UConn', seed: 8, region: 'West' },
  { id: 20, name: 'Oklahoma', seed: 9, region: 'West' },
  { id: 21, name: 'Memphis', seed: 5, region: 'West' },
  { id: 22, name: 'Colorado St', seed: 12, region: 'West' },
  { id: 23, name: 'Maryland', seed: 4, region: 'West' },
  { id: 24, name: 'Grand Canyon', seed: 13, region: 'West' },
  { id: 25, name: 'Missouri', seed: 6, region: 'West' },
  { id: 26, name: 'Liberty', seed: 11, region: 'West' },
  { id: 27, name: 'Texas Tech', seed: 3, region: 'West' },
  { id: 28, name: 'UNC Wilmington', seed: 14, region: 'West' },
  { id: 29, name: 'Kansas', seed: 7, region: 'West' },
  { id: 30, name: 'Arkansas', seed: 10, region: 'West' },
  { id: 31, name: "St. John's", seed: 2, region: 'West' },
  { id: 32, name: 'Omaha', seed: 15, region: 'West' },

  // South Region
  { id: 33, name: 'Auburn', seed: 1, region: 'South' },
  { id: 34, name: 'Alabama St', seed: 16, region: 'South' },
  { id: 35, name: 'Louisville', seed: 8, region: 'South' },
  { id: 36, name: 'Oregon', seed: 9, region: 'South' },
  { id: 37, name: 'Baylor', seed: 5, region: 'South' },
  { id: 38, name: 'VCU', seed: 12, region: 'South' },
  { id: 39, name: 'Wisconsin', seed: 4, region: 'South' },
  { id: 40, name: 'Akron', seed: 13, region: 'South' },
  { id: 41, name: 'BYU', seed: 6, region: 'South' },
  { id: 42, name: 'Vanderbilt', seed: 11, region: 'South' },
  { id: 43, name: 'Texas A&M', seed: 3, region: 'South' },
  { id: 44, name: 'Yale', seed: 14, region: 'South' },
  { id: 45, name: 'UCLA', seed: 7, region: 'South' },
  { id: 46, name: 'Utah St', seed: 10, region: 'South' },
  { id: 47, name: 'Michigan', seed: 2, region: 'South' },
  { id: 48, name: 'Wofford', seed: 15, region: 'South' },

  // Midwest Region
  { id: 49, name: 'Houston', seed: 1, region: 'Midwest' },
  { id: 50, name: 'SIU Edwardsville', seed: 16, region: 'Midwest' },
  { id: 51, name: 'Gonzaga', seed: 8, region: 'Midwest' },
  { id: 52, name: 'Georgia', seed: 9, region: 'Midwest' },
  { id: 53, name: 'Marquette', seed: 5, region: 'Midwest' },
  { id: 54, name: 'New Mexico', seed: 12, region: 'Midwest' },
  { id: 55, name: 'Iowa St', seed: 4, region: 'Midwest' },
  { id: 56, name: 'Colgate', seed: 13, region: 'Midwest' },
  { id: 57, name: 'Michigan St', seed: 6, region: 'Midwest' },
  { id: 58, name: 'Xavier', seed: 11, region: 'Midwest' },
  { id: 59, name: 'Texas', seed: 3, region: 'Midwest' },
  { id: 60, name: 'Robert Morris', seed: 14, region: 'Midwest' },
  { id: 61, name: 'San Diego St', seed: 7, region: 'Midwest' },
  { id: 62, name: 'North Carolina', seed: 10, region: 'Midwest' },
  { id: 63, name: 'Alabama', seed: 2, region: 'Midwest' },
  { id: 64, name: "Mount St. Mary's", seed: 15, region: 'Midwest' },
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
