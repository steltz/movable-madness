import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './home-page';

const mockAuthContext = {
  user: null,
  firebaseUser: null,
  loading: false,
  isAuthenticated: false,
  isAnonymous: false,
  bracketName: null,
};

vi.mock('../../app/providers/auth-provider', () => ({
  useAuthContext: () => mockAuthContext,
}));

vi.mock('../../features/auth', () => ({
  signInAnonymously: vi.fn().mockResolvedValue({ uid: 'test-uid' }),
}));

vi.mock('../../shared/api/api-client', () => ({
  post: vi.fn().mockResolvedValue({ success: true }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe('HomePage', () => {
  beforeEach(() => {
    mockAuthContext.user = null;
    mockAuthContext.firebaseUser = null;
    mockAuthContext.loading = false;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.isAnonymous = false;
    mockAuthContext.bracketName = null;
  });

  describe('loading state', () => {
    it('should show loading text while auth initializes', () => {
      mockAuthContext.loading = true;
      renderPage();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('unauthenticated (login form)', () => {
    it('should render the login form with branding', () => {
      renderPage();
      expect(screen.getByText('Movable Madness')).toBeInTheDocument();
      expect(screen.getByText('Join Tournament')).toBeInTheDocument();
      expect(screen.getByLabelText(/bracket name/i)).toBeInTheDocument();
    });

    it('should show browser session warning', () => {
      renderPage();
      expect(screen.getByText(/same browser/i)).toBeInTheDocument();
    });

    it('should show error when submitting empty bracket name', async () => {
      renderPage();
      fireEvent.click(screen.getByText('Join Tournament'));
      expect(await screen.findByText('Please enter a bracket name')).toBeInTheDocument();
    });
  });

  describe('authenticated bracket player (dashboard)', () => {
    beforeEach(() => {
      mockAuthContext.user = { uid: 'test-uid', role: 'bracket_user' as const };
      mockAuthContext.isAuthenticated = true;
      mockAuthContext.isAnonymous = true;
      mockAuthContext.bracketName = "Nick's Final Four";
    });

    it('should display the bracket name in the welcome header', () => {
      renderPage();
      expect(screen.getByText(/Nick's Final Four/)).toBeInTheDocument();
    });

    it('should render Edit My Bracket card linking to /brackets/edit', () => {
      renderPage();
      expect(screen.getByText('Edit My Bracket')).toBeInTheDocument();
      const link = screen.getByText('Edit My Bracket').closest('a');
      expect(link).toHaveAttribute('href', '/brackets/edit');
    });

    it('should render View Submitted Brackets card linking to /brackets', () => {
      renderPage();
      expect(screen.getByText('View Submitted Brackets')).toBeInTheDocument();
      const link = screen.getByText('View Submitted Brackets').closest('a');
      expect(link).toHaveAttribute('href', '/brackets');
    });

    it('should show fallback name when bracketName is null', () => {
      mockAuthContext.bracketName = null;
      renderPage();
      expect(screen.getByText(/Player/)).toBeInTheDocument();
    });
  });
});
