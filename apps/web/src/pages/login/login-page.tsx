import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@movable-madness/ui';
import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../app/providers/auth-provider';
import { createBracketUser, signInAnonymously } from '../../features/bracket-auth';

export function LoginPage() {
  const { isAuthenticated, loading } = useAuthContext();
  const navigate = useNavigate();
  const [bracketName, setBracketName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = bracketName.trim();
    if (!trimmed) {
      setError('Please enter a bracket name');
      return;
    }

    setSubmitting(true);
    try {
      await signInAnonymously();
      await createBracketUser(trimmed);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Movable Madness</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Enter your bracket name to get started
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="bracketName">Bracket Name</Label>
              <Input
                id="bracketName"
                type="text"
                value={bracketName}
                onChange={(e) => setBracketName(e.target.value)}
                placeholder="e.g. Nick's Hot Picks"
                disabled={submitting}
                autoComplete="off"
                maxLength={50}
              />
            </div>

            <Button
              type="submit"
              className="mt-2 w-full bg-brand-magenta text-white hover:bg-brand-magenta-hover"
              size="lg"
              disabled={submitting}
            >
              {submitting ? 'Joining...' : 'Join Tournament'}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-2">
              You must use the same browser to return to your picks. Your session is tied to this
              device.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
