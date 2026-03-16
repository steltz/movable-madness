import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../../app/providers/auth-provider';
import { useBracket } from '../model/use-bracket';
import { BracketGrid } from './bracket-grid';
import { SubmitFooter } from './submit-footer';

export function BracketEditorPage() {
  const { bracketName } = useAuthContext();

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
    return <Navigate to="/brackets" replace />;
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
