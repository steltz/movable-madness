import { Button, Input, Label } from '@movable-madness/ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../app/providers/auth-provider';
import { signInAnonymously, signOut } from '../../features/auth';
import { post } from '../../shared/api/api-client';

export function HomePage() {
  const { isAuthenticated, isAnonymous, loading, bracketName } = useAuthContext();
  const [inputName, setInputName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show dashboard for authenticated anonymous users (bracket players)
  // The submitting guard prevents premature flip to dashboard during join flow
  const showDashboard = isAuthenticated && isAnonymous && !submitting;

  if (showDashboard) {
    return <Dashboard bracketName={bracketName} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = inputName.trim();
    if (!trimmed) {
      setError('Please enter a bracket name');
      return;
    }
    if (trimmed.length > 50) {
      setError('Bracket name must be 50 characters or less');
      return;
    }

    setSubmitting(true);
    try {
      await signInAnonymously();
      await post('/brackets/join', { bracketName: trimmed });
      // Auth state change triggers re-render to dashboard view
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4 font-[Inter,system-ui,sans-serif]">
      <div className="w-full max-w-[400px] rounded-xl bg-card p-10 shadow-lg text-center dark:shadow-xl dark:shadow-black/20">
        <div className="mb-2 text-4xl">🏀</div>
        <h1 className="mb-1 text-2xl font-bold text-foreground">Movable Madness</h1>
        <p className="mb-8 text-sm text-muted-foreground">Enter your bracket name to get started</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6 text-left">
            <Label
              htmlFor="bracketName"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Bracket Name
            </Label>
            <Input
              id="bracketName"
              type="text"
              placeholder="e.g., Nick's Final Four"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              maxLength={50}
              disabled={submitting}
              className="w-full"
            />
          </div>

          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
          >
            {submitting ? 'Joining...' : 'Join Tournament'}
          </Button>
        </form>

        <div className="mt-5 flex items-start gap-2 rounded-lg bg-warning p-3 text-left">
          <span className="flex-shrink-0 text-base">⚠️</span>
          <p className="text-xs leading-relaxed text-warning-foreground">
            You must use the same browser to return to your picks. Your session is tied to this
            browser only.
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ bracketName }: { bracketName: string | null }) {
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-muted font-[Inter,system-ui,sans-serif]">
      <header className="flex items-center justify-between border-b border-border bg-card px-8 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🏀</span>
          <span className="text-lg font-bold text-foreground">Movable Madness</span>
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="text-sm font-medium text-brand hover:text-brand/80"
        >
          Sign Out
        </Button>
      </header>

      <main className="mx-auto max-w-[640px] px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="mb-1.5 text-2xl font-bold text-foreground">
            Welcome, {bracketName ?? 'Player'}! 👋
          </h1>
          <p className="text-base text-muted-foreground">What would you like to do?</p>
        </div>

        <div className="flex flex-col gap-5">
          <Link to="/brackets/edit" className="block">
            <div className="rounded-xl border-t-[3px] border-t-brand bg-card p-7 shadow-md transition-shadow hover:shadow-lg dark:shadow-lg dark:shadow-black/20 dark:hover:shadow-xl dark:hover:shadow-black/25">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-brand-muted text-2xl">
                  ✏️
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-foreground">Edit My Bracket</h3>
                  <p className="text-sm text-muted-foreground">Make your picks for all 64 teams</p>
                </div>
                <span className="text-xl text-muted-foreground">→</span>
              </div>
            </div>
          </Link>

          <Link to="/brackets" className="block">
            <div className="rounded-xl border-t-[3px] border-t-brand bg-card p-7 shadow-md transition-shadow hover:shadow-lg dark:shadow-lg dark:shadow-black/20 dark:hover:shadow-xl dark:hover:shadow-black/25">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-brand-muted text-2xl">
                  📊
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-foreground">
                    View Submitted Brackets
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    See how others filled out their brackets
                  </p>
                </div>
                <span className="text-xl text-muted-foreground">→</span>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
