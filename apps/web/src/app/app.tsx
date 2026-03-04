import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminHomePage } from '../pages/admin/home/admin-home-page';
import { AccountSettingsPage } from '../pages/admin/settings/account-settings-page';
import { SubmittedBracketsPage } from '../pages/brackets/submitted-brackets-page';
import { DashboardPage } from '../pages/dashboard/dashboard-page';
import { LoginPage } from '../pages/login/login-page';
import { SignInPage } from '../pages/sign-in/sign-in-page';
import { AppErrorBoundary } from './app-error-boundary';
import { AuthProvider, useAuthContext } from './providers/auth-provider';
import { ThemeProvider } from './providers/theme-provider';

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
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/brackets" element={<SubmittedBracketsPage />} />
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
