import { Outlet } from 'react-router-dom';
import { AppBar } from '../../features/app-bar';
import { useAuthContext } from '../providers/auth-provider';

export function AppLayout() {
  const { isAuthenticated, loading } = useAuthContext();

  return (
    <>
      {isAuthenticated && !loading && <AppBar />}
      <Outlet />
    </>
  );
}
