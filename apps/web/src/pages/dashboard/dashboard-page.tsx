import { Button, Card, CardContent, CardHeader, CardTitle } from '@movable-madness/ui';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../app/providers/auth-provider';

export function DashboardPage() {
  const { bracketUser, isAuthenticated, loading } = useAuthContext();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !bracketUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {bracketUser.bracketName}!
          </h1>
          <p className="text-muted-foreground mt-2">What would you like to do?</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="border-0 border-t-4 border-t-brand-magenta shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Edit My Bracket</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Make your picks for all 64 teams in the tournament.
              </p>
              <Button
                className="w-full bg-brand-magenta text-white hover:bg-brand-magenta-hover"
                size="lg"
                onClick={() => navigate('/bracket/edit')}
              >
                Edit My Bracket
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 border-t-4 border-t-brand-magenta shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">View Submitted Brackets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                See how other participants filled out their brackets.
              </p>
              <Button
                className="w-full bg-brand-magenta text-white hover:bg-brand-magenta-hover"
                size="lg"
                onClick={() => navigate('/brackets')}
              >
                View Submitted Brackets
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
