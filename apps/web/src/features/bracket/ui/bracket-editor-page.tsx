import { Navigate, useSearchParams } from 'react-router-dom';
import { useBracket } from '../model/use-bracket';
import { BracketGrid } from './bracket-grid';
import { SubmitFooter } from './submit-footer';

export function BracketEditorPage() {
  const [searchParams] = useSearchParams();
  const bracketName = searchParams.get('name');

  if (!bracketName) {
    return <Navigate to="/" replace />;
  }

  return <BracketEditorContent bracketName={bracketName} />;
}

function BracketEditorContent({ bracketName }: { bracketName: string }) {
  const {
    picks,
    selectWinner,
    getTeams,
    picksCount,
    isComplete,
    submitBracket,
    isSubmitting,
    submitError,
    isSubmitted,
  } = useBracket({ bracketName });

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-3xl font-bold text-foreground">Bracket Submitted!</h1>
        <p className="text-muted-foreground">Your bracket "{bracketName}" has been saved.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold text-foreground">{bracketName}</h1>
        <p className="text-sm text-muted-foreground">Click a team to advance them</p>
      </header>
      <BracketGrid picks={picks} getTeams={getTeams} onSelectWinner={selectWinner} />
      <SubmitFooter
        picksCount={picksCount}
        isComplete={isComplete}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={submitBracket}
      />
    </div>
  );
}
