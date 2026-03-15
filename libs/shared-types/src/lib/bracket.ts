export interface Team {
  id: number;
  name: string;
  seed: number;
  region: 'East' | 'West' | 'South' | 'Midwest';
}

export type BracketPicks = Record<string, number | null>;

export interface BracketSubmission {
  bracketName: string;
  picks: BracketPicks;
}
