import { Alert, AlertDescription, AlertTitle } from '@movable-madness/ui';
import { SubmittedBracketsTable, useBracketsListener } from '../../features/brackets';

export function SubmittedBracketsPage() {
  const { brackets, loading, error } = useBracketsListener();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 font-[Inter,system-ui,sans-serif]">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Submitted Brackets</h1>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : !loading && brackets.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No brackets submitted yet. Be the first!
        </p>
      ) : (
        <SubmittedBracketsTable brackets={brackets} loading={loading} />
      )}
    </div>
  );
}
