import { Button } from '@movable-madness/ui';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../app/providers/auth-provider';
import { signOut } from '../../../features/auth';

export function BracketDashboardPage() {
  const { bracketName } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/bracket/login', { replace: true });
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-[Inter,system-ui,sans-serif]">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🏀</span>
          <span className="text-lg font-bold text-gray-900">Movable Madness</span>
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="text-sm font-medium text-[#E31C79] hover:text-[#c8186b]"
        >
          Sign Out
        </Button>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[640px] px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="mb-1.5 text-2xl font-bold text-gray-900">
            Welcome, {bracketName ?? 'Player'}! 👋
          </h1>
          <p className="text-base text-gray-500">What would you like to do?</p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Edit My Bracket card */}
          <Link to="/bracket/edit" className="block">
            <div className="rounded-xl border-t-[3px] border-t-[#E31C79] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FDE8F1] text-2xl">
                  ✏️
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">Edit My Bracket</h3>
                  <p className="text-sm text-gray-500">Make your picks for all 64 teams</p>
                </div>
                <span className="text-xl text-gray-300">→</span>
              </div>
            </div>
          </Link>

          {/* View Submitted Brackets card */}
          <Link to="/brackets" className="block">
            <div className="rounded-xl border-t-[3px] border-t-[#E31C79] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FDE8F1] text-2xl">
                  📊
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">
                    View Submitted Brackets
                  </h3>
                  <p className="text-sm text-gray-500">See how others filled out their brackets</p>
                </div>
                <span className="text-xl text-gray-300">→</span>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
