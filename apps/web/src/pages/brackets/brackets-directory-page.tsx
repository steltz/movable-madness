import { Alert, AlertDescription, AlertTitle } from '@movable-madness/ui';
import { AlertCircle } from 'lucide-react';
import { BracketsTable } from './brackets-table';
import { useBrackets } from './use-brackets';

export function BracketsDirectoryPage() {
  const { entries, loading, error } = useBrackets();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Unable to load brackets. Please try again later.</AlertDescription>
          </Alert>
        ) : (
          <BracketsTable entries={entries} loading={loading} />
        )}
      </div>
    </div>
  );
}
