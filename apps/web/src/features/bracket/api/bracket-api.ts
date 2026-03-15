import type { ApiResponse, BracketSubmission } from '@movable-madness/shared-types';
import { post } from '../../../shared/api/api-client';

export function submitBracket(
  submission: BracketSubmission,
): Promise<ApiResponse<{ bracketId: string }>> {
  return post('/brackets', submission);
}
