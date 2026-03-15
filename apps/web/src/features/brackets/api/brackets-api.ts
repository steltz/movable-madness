import type { ApiResponse, BracketDocument } from '@movable-madness/shared-types';

const API_BASE_URL = '/api';

export async function fetchBracket(bracketId: string): Promise<ApiResponse<BracketDocument>> {
  const response = await fetch(`${API_BASE_URL}/brackets/${bracketId}`);
  return response.json();
}
