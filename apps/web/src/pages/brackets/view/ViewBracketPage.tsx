import type { BracketDocument } from '@movable-madness/shared-types';
import { Alert, AlertDescription } from '@movable-madness/ui';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchBracket } from '../../../features/brackets/api/brackets-api';
import { BracketGrid } from '../../../features/brackets/components/BracketGrid';
import { BracketHeader } from '../../../features/brackets/components/BracketHeader';

function BracketSkeleton() {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[1100px] gap-4 px-4 py-6">
        {[32, 16, 8, 4].map((count) => (
          <div key={count} className="flex shrink-0 basis-40 flex-col gap-2">
            <div className="mx-auto h-3 w-20 animate-pulse rounded bg-gray-200" />
            {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton UI with no reordering
              <div key={j} className="h-12 animate-pulse rounded-md bg-gray-200" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ViewBracketPage() {
  const { bracketId } = useParams<{ bracketId: string }>();
  const [bracket, setBracket] = useState<BracketDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bracketId) return;

    setLoading(true);
    setError(null);

    fetchBracket(bracketId)
      .then((response) => {
        if (response.success && response.data) {
          setBracket(response.data);
        } else {
          setError(response.error?.message ?? 'Bracket not found');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load bracket');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bracketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse bg-pink-200 px-6 py-4">
          <div className="h-6 w-48 rounded bg-pink-300" />
          <div className="mt-2 h-3 w-32 rounded bg-pink-300" />
        </div>
        <BracketSkeleton />
      </div>
    );
  }

  if (error || !bracket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md px-4">
          <Alert variant="destructive">
            <AlertDescription>{error ?? 'Bracket not found'}</AlertDescription>
          </Alert>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm text-[#E31C79] underline hover:text-[#c4166a]"
            >
              Try again
            </button>
            <Link to="/" className="text-sm text-gray-500 underline hover:text-gray-700">
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BracketHeader bracketName={bracket.bracketName} createdAt={bracket.createdAt} />
      <BracketGrid teams={bracket.teams} picks={bracket.picks} />
    </div>
  );
}
