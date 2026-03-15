import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@movable-madness/ui';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../app/providers/auth-provider';
import { signOut } from '../../../features/auth';

export function AccountSettingsPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/sign-in', { replace: true });
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <Button variant="link" className="mb-1 h-auto p-0 text-sm" asChild>
          <Link to="/admin">&larr; Back to Dashboard</Link>
        </Button>
        <h1 className="text-2xl font-semibold text-card-foreground">Account Settings</h1>
      </header>

      <main className="mx-auto max-w-xl p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Email</p>
              <p className="text-foreground">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">User ID</p>
              <p className="rounded bg-muted px-2 py-1 font-mono text-sm text-foreground">
                {user?.uid}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Role</p>
              <Badge variant="secondary">{user?.role}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Sign out of your account. You will need to sign in again to access the admin
              dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
