import type { ApiResponse, BracketUserDocument } from '@movable-madness/shared-types';
import { get, post } from '../../../shared/api/api-client';

export async function createBracketUser(bracketName: string): Promise<BracketUserDocument> {
  const response = await post<ApiResponse<BracketUserDocument>>('/bracket-users', { bracketName });
  if (!response.success || !response.data) {
    throw new Error('Failed to create bracket user profile');
  }
  return response.data;
}

export async function getBracketUserMe(): Promise<BracketUserDocument | null> {
  try {
    const response = await get<ApiResponse<BracketUserDocument>>('/bracket-users/me');
    return response.data ?? null;
  } catch {
    return null;
  }
}
