import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@movable-madness/ui';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../../app/providers/auth-provider';

export function AdminHomePage() {
  const { user } = useAuthContext();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-semibold text-card-foreground">Admin Dashboard</h1>
        <nav>
          <Button variant="ghost" asChild>
            <Link to="/admin/settings">Account Settings</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome back!</CardTitle>
            <CardDescription>
              You are signed in as <strong>{user?.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Role: <Badge variant="secondary">{user?.role}</Badge>
            </p>
          </CardContent>
        </Card>

        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Settings</CardTitle>
              <CardDescription>Configure application settings</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
