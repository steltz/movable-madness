import type { ApiResponse } from '@movable-madness/shared-types';
import { Button } from '@movable-madness/ui';
import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { signOut } from '../features/auth';
import { BracketEditorPage } from '../features/bracket';
import { AdminHomePage } from '../pages/admin/home/admin-home-page';
import { AccountSettingsPage } from '../pages/admin/settings/account-settings-page';
import { BracketsDirectoryPage } from '../pages/brackets/brackets-directory-page';
import { ViewBracketPage } from '../pages/brackets/view/ViewBracketPage';
import { SignInPage } from '../pages/sign-in/sign-in-page';
import { AppErrorBoundary } from './app-error-boundary';
import { AuthProvider, useAuthContext } from './providers/auth-provider';
import { ThemeProvider } from './providers/theme-provider';

function HomePage() {
  const [message, setMessage] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, loading } = useAuthContext();

  useEffect(() => {
    fetch('/api')
      .then((res) => res.json())
      .then((data: ApiResponse<string>) => {
        if (data.success && data.data) {
          setMessage(data.data);
        } else if (data.error) {
          setError(data.error.message);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Nx Monorepo Template</h1>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user?.email} ({user?.role})
              </span>
              <Button variant="destructive" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <a href="/sign-in">Sign In</a>
            </Button>
          )}
        </nav>
      </div>
      {error ? (
        <p className="mt-4 text-destructive">Error: {error}</p>
      ) : (
        <p className="mt-4 text-foreground">API Response: {message}</p>
      )}
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/brackets" element={<BracketsDirectoryPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <AccountSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/brackets/:bracketId" element={<ViewBracketPage />} />
      <Route path="/bracket/edit" element={<BracketEditorPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;
