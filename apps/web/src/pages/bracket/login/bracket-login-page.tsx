import { Button, Input, Label } from '@movable-madness/ui';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../app/providers/auth-provider';
import { signInAnonymously } from '../../../features/auth';
import { post } from '../../../shared/api/api-client';

export function BracketLoginPage() {
  const { isAuthenticated, isAnonymous, loading } = useAuthContext();
  const navigate = useNavigate();
  const [bracketName, setBracketName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Redirect if already authenticated as anonymous user (but not while submitting,
  // since signInAnonymously fires onAuthStateChanged before the API call completes)
  if (isAuthenticated && isAnonymous && !submitting) {
    return <Navigate to="/bracket/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = bracketName.trim();
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
      navigate('/bracket/dashboard', { replace: true });
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
              value={bracketName}
              onChange={(e) => setBracketName(e.target.value)}
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
