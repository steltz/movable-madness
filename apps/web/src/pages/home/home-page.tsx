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
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-gray-500">Loading...</p>
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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-4 font-[Inter,system-ui,sans-serif]">
      <div className="w-full max-w-[400px] rounded-xl bg-white p-10 shadow-[0_4px_24px_rgba(0,0,0,0.08)] text-center">
        <div className="mb-2 text-4xl">🏀</div>
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Movable Madness</h1>
        <p className="mb-8 text-sm text-gray-500">Enter your bracket name to get started</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6 text-left">
            <Label htmlFor="bracketName" className="mb-1.5 block text-xs font-medium text-gray-600">
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
              className="w-full dark:text-gray-900"
            />
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#E31C79] py-3 text-sm font-semibold text-white hover:bg-[#c8186b] disabled:opacity-50"
          >
            {submitting ? 'Joining...' : 'Join Tournament'}
          </Button>
        </form>

        <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#FFF8E1] p-3 text-left">
          <span className="flex-shrink-0 text-base">⚠️</span>
          <p className="text-xs leading-relaxed text-[#7a6520]">
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
    <div className="min-h-screen bg-[#f5f5f5] font-[Inter,system-ui,sans-serif]">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🏀</span>
          <span className="text-lg font-bold text-gray-900">Movable Madness</span>
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="text-sm font-medium text-[#E31C79] hover:text-[#c8186b]"
        >
          Sign Out
        </Button>
      </header>

      <main className="mx-auto max-w-[640px] px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="mb-1.5 text-2xl font-bold text-gray-900">
            Welcome, {bracketName ?? 'Player'}! 👋
          </h1>
          <p className="text-base text-gray-500">What would you like to do?</p>
        </div>

        <div className="flex flex-col gap-5">
          <Link to="/brackets/edit" className="block">
            <div className="rounded-xl border-t-[3px] border-t-[#E31C79] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FDE8F1] text-2xl">
                  ✏️
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">Edit My Bracket</h3>
                  <p className="text-sm text-gray-500">Make your picks for all 64 teams</p>
                </div>
                <span className="text-xl text-gray-300">→</span>
              </div>
            </div>
          </Link>

          <Link to="/brackets" className="block">
            <div className="rounded-xl border-t-[3px] border-t-[#E31C79] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FDE8F1] text-2xl">
                  📊
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">
                    View Submitted Brackets
                  </h3>
                  <p className="text-sm text-gray-500">See how others filled out their brackets</p>
                </div>
                <span className="text-xl text-gray-300">→</span>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
