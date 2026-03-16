import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { BracketEditorPage } from '../features/bracket';
import { AdminHomePage } from '../pages/admin/home/admin-home-page';
import { AccountSettingsPage } from '../pages/admin/settings/account-settings-page';
import { BracketsDirectoryPage } from '../pages/brackets/brackets-directory-page';
import { ViewBracketPage } from '../pages/brackets/view/ViewBracketPage';
import { HomePage } from '../pages/home/home-page';
import { SignInPage } from '../pages/sign-in/sign-in-page';
import { AppErrorBoundary } from './app-error-boundary';
import { AppLayout } from './layouts/app-layout';
import { AuthProvider, useAuthContext } from './providers/auth-provider';
import { ThemeProvider } from './providers/theme-provider';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAnonymous, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || isAnonymous) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

function BracketProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAnonymous, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAnonymous) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* No app bar */}
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/brackets/:bracketId" element={<ViewBracketPage />} />

      {/* App bar shown when authenticated */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/brackets" element={<BracketsDirectoryPage />} />
        <Route
          path="/brackets/edit"
          element={
            <BracketProtectedRoute>
              <BracketEditorPage />
            </BracketProtectedRoute>
          }
        />
        <Route path="/brackets/login" element={<Navigate to="/" replace />} />
        <Route path="/brackets/dashboard" element={<Navigate to="/" replace />} />
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
      </Route>

      {/* 404 - no app bar */}
      <Route
        path="*"
        element={
          <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
            <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
            <Link to="/" className="text-sm text-[#E31C79] underline hover:text-[#c8186b]">
              Go home
            </Link>
          </div>
        }
      />
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
