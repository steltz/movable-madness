export interface BracketDocument {
  bracketName: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  picks: Record<string, string>;
  teams: string[];
}

export interface Matchup {
  id: string;
  teamA: string | null;
  teamB: string | null;
  winner: string | null;
}

export interface Round {
  label: string;
  matchups: Matchup[];
}
