export interface Team {
  id: number;
  name: string;
  seed: number;
  region: 'East' | 'West' | 'South' | 'Midwest';
}

export type BracketPicks = Record<string, number | null>;

export type BracketStatus = 'in_progress' | 'submitted';

/** Portable timestamp compatible with both firebase and firebase-admin SDKs. */
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface BracketSubmission {
  bracketName: string;
  picks: BracketPicks;
}

export interface BracketEntry {
  bracketName: string;
  status: BracketStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}
