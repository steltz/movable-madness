import { Badge, Card, CardContent, CardHeader, CardTitle } from '@movable-madness/ui';
import { useAuthContext } from '../../../app/providers/auth-provider';

export function AccountSettingsPage() {
  const { user } = useAuthContext();

  return (
    <div className="bg-background">
      <main className="mx-auto max-w-xl p-6">
        <h1 className="mb-6 text-2xl font-semibold text-card-foreground">Account Settings</h1>

        <Card>
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
      </main>
    </div>
  );
}
