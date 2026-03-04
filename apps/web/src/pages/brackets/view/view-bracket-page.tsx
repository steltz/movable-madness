import type { ApiResponse, BracketDocument } from '@movable-madness/shared-types';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BracketGrid } from '../../../features/brackets/components/bracket-grid';
import { BracketHeader } from '../../../features/brackets/components/bracket-header';
import { buildBracketTree } from '../../../features/brackets/utils/build-bracket-tree';
import { get } from '../../../shared/api/api-client';

export function ViewBracketPage() {
  const { bracketId } = useParams<{ bracketId: string }>();
  const [bracket, setBracket] = useState<BracketDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bracketId) return;

    get<ApiResponse<BracketDocument>>(`/brackets/${bracketId}`)
      .then((res) => {
        if (res.success && res.data) {
          setBracket(res.data);
        } else {
          setError(res.error?.message ?? 'Failed to load bracket');
        }
      })
      .catch((err) => {
        setError(err.message ?? 'Failed to load bracket');
      })
      .finally(() => setLoading(false));
  }, [bracketId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading bracket...</p>
      </div>
    );
  }

  if (error || !bracket) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-lg text-gray-700">{error ?? 'Bracket not found'}</p>
        <Link to="/" className="text-sm font-medium text-[#E31C79] hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const rounds = buildBracketTree(bracket.teams, bracket.picks);

  return (
    <div className="min-h-screen bg-gray-50">
      <BracketHeader bracketName={bracket.bracketName} />
      <BracketGrid rounds={rounds} />
    </div>
  );
}
