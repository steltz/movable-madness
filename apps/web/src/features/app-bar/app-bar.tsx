import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from '@movable-madness/ui';
import { LogOut, Moon, Sun } from 'lucide-react';
import { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../app/providers/theme-provider';
import { signOut } from '../auth';
import { useBreadcrumbs } from './use-breadcrumbs';

export function AppBar() {
  const breadcrumbs = useBreadcrumbs();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/sign-in', { replace: true });
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const handleToggleTheme = () => {
    // Two-state toggle: dark <-> light. Treat 'system' as dark.
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  const currentPage = breadcrumbs[breadcrumbs.length - 1];

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b-2 border-b-[#E31C79] bg-card px-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-[15px] font-bold text-[#E31C79] hover:text-[#c8186b]">
          Movable Madness
        </Link>

        <span className="text-muted-foreground">/</span>

        {/* Full breadcrumb trail — hidden on small screens */}
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={crumb.path}>
                {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
                <BreadcrumbItem>
                  {crumb.isCurrentPage ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.path}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Current page only — shown on small screens */}
        <span className="text-sm font-medium text-foreground sm:hidden">{currentPage.label}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleToggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="mr-1.5 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}
