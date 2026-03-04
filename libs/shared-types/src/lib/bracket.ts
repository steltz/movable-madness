export interface Team {
  id: string;
  name: string;
  seed: number;
  region: 'East' | 'West' | 'South' | 'Midwest';
}

export interface BracketEntry {
  id?: string;
  userId: string;
  bracketName: string;
  picks: Record<string, string>;
  submittedAt?: string;
}

export interface CreateBracketRequest {
  userId: string;
  bracketName: string;
  picks: Record<string, string>;
}
