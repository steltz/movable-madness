import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@movable-madness/ui';
import { useState } from 'react';
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
    isLoading,
    quickPick,
  } = useBracket({ bracketName });

  const [showConfirm, setShowConfirm] = useState(false);

  const handleQuickPick = () => {
    if (picksCount > 0) {
      setShowConfirm(true);
    } else {
      quickPick();
    }
  };

  const handleConfirmQuickPick = () => {
    quickPick();
    setShowConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading bracket...</p>
      </div>
    );
  }

  if (isSubmitted) {
    return <Navigate to="/brackets" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{bracketName}</h1>
          <p className="text-sm text-muted-foreground">Click a team to advance them</p>
        </div>
        <Button variant="outline" aria-label="Quick Pick" onClick={handleQuickPick}>
          🎲 Quick Pick
        </Button>
      </header>
      <BracketGrid picks={picks} getTeams={getTeams} onSelectWinner={selectWinner} />
      <SubmitFooter
        picksCount={picksCount}
        isComplete={isComplete}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={submitBracket}
      />
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace all picks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all your current picks with random selections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmQuickPick}>Quick Pick</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
