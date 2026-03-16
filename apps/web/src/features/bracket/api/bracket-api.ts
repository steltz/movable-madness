import type {
  ApiResponse,
  BracketDocument,
  BracketSubmission,
} from '@movable-madness/shared-types';
import { get, post } from '../../../shared/api/api-client';

export function submitBracket(
  submission: BracketSubmission,
): Promise<ApiResponse<{ bracketId: string }>> {
  return post('/brackets', submission);
}

export function fetchMyBracket(): Promise<ApiResponse<BracketDocument>> {
  return get('/brackets/mine');
}
