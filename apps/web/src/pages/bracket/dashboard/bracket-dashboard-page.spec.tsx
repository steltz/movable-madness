import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { BracketDashboardPage } from './bracket-dashboard-page';

const mockAuthContext = {
  user: { uid: 'test-uid', role: 'bracket_user' as const },
  firebaseUser: null,
  loading: false,
  isAuthenticated: true,
  isAnonymous: true,
  bracketName: "Nick's Final Four",
};

vi.mock('../../../app/providers/auth-provider', () => ({
  useAuthContext: () => mockAuthContext,
}));

vi.mock('../../../features/auth', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}));

const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <BracketDashboardPage />
    </MemoryRouter>,
  );

describe('BracketDashboardPage', () => {
  it('should display the bracket name in the welcome header', () => {
    renderWithRouter();
    expect(screen.getByText(/Nick's Final Four/)).toBeInTheDocument();
  });

  it('should render Edit My Bracket navigation card', () => {
    renderWithRouter();
    expect(screen.getByText('Edit My Bracket')).toBeInTheDocument();
    expect(screen.getByText('Make your picks for all 64 teams')).toBeInTheDocument();
  });

  it('should render View Submitted Brackets navigation card', () => {
    renderWithRouter();
    expect(screen.getByText('View Submitted Brackets')).toBeInTheDocument();
    expect(screen.getByText('See how others filled out their brackets')).toBeInTheDocument();
  });

  it('should link Edit My Bracket to /brackets/edit', () => {
    renderWithRouter();
    const link = screen.getByText('Edit My Bracket').closest('a');
    expect(link).toHaveAttribute('href', '/brackets/edit');
  });

  it('should link View Submitted Brackets to /brackets', () => {
    renderWithRouter();
    const link = screen.getByText('View Submitted Brackets').closest('a');
    expect(link).toHaveAttribute('href', '/brackets');
  });

  it('should render Sign Out button', () => {
    renderWithRouter();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should show fallback name when bracketName is null', () => {
    mockAuthContext.bracketName = null;
    renderWithRouter();
    expect(screen.getByText(/Player/)).toBeInTheDocument();
    mockAuthContext.bracketName = "Nick's Final Four";
  });
});
