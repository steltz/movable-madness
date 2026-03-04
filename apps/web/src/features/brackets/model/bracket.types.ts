export type BracketStatus = 'in_progress' | 'submitted';

export interface BracketEntry {
  id: string;
  bracketName: string;
  userId: string;
  status: BracketStatus;
  createdAt: Date;
  updatedAt: Date;
}
