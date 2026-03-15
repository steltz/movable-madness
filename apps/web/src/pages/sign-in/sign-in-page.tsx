import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../app/providers/auth-provider';
import { SignInForm } from '../../features/auth';

export function SignInPage() {
  const { user, isAnonymous, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user && !isAnonymous) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <SignInForm />
    </div>
  );
}
