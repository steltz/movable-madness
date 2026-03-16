import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppBar } from './app-bar';

const mockSetTheme = vi.fn();
let mockTheme = 'dark';

vi.mock('../../app/providers/theme-provider', () => ({
  useTheme: () => ({ theme: mockTheme, setTheme: mockSetTheme }),
}));

const mockSignOut = vi.fn().mockResolvedValue(undefined);
vi.mock('../auth', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderAppBar = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppBar />
    </MemoryRouter>,
  );

describe('AppBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme = 'dark';
  });

  it('should render the app name linking to home', () => {
    renderAppBar();
    const link = screen.getByText('Movable Madness');
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });

  it('should render breadcrumbs for the current path', () => {
    renderAppBar('/brackets');
    // Text appears twice: in breadcrumb and in mobile view
    expect(screen.getAllByText('Brackets').length).toBeGreaterThan(0);
  });

  it('should not render breadcrumbs on home page', () => {
    renderAppBar('/');
    // Only "Movable Madness" should be present, no separator or breadcrumbs
    expect(screen.getByText('Movable Madness')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('should render ancestor breadcrumbs as links', () => {
    renderAppBar('/admin/settings');
    const adminLink = screen.getByText('Admin').closest('a');
    expect(adminLink).toHaveAttribute('href', '/admin');
  });

  it('should render current page breadcrumb as non-link text', () => {
    renderAppBar('/admin/settings');
    // Text appears in both breadcrumb and mobile view, check both aren't links
    const settingsElements = screen.getAllByText('Settings');
    settingsElements.forEach((element) => {
      expect(element.closest('a')).toBeNull();
    });
  });

  it('should render sign out button', () => {
    renderAppBar();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('should call signOut and navigate to / on sign out click', async () => {
    const user = userEvent.setup();
    renderAppBar();
    await user.click(screen.getByRole('button', { name: /sign out/i }));
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('should render theme toggle button', () => {
    renderAppBar();
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('should toggle theme from dark to light', async () => {
    mockTheme = 'dark';
    const user = userEvent.setup();
    renderAppBar();
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('should toggle theme from light to dark', async () => {
    mockTheme = 'light';
    const user = userEvent.setup();
    renderAppBar();
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('should treat system theme as dark and toggle to light', async () => {
    mockTheme = 'system';
    const user = userEvent.setup();
    renderAppBar();
    await user.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
