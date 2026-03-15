import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BracketLoginPage } from './bracket-login-page';

// Mock the auth context
const mockAuthContext = {
  user: null,
  firebaseUser: null,
  loading: false,
  isAuthenticated: false,
  isAnonymous: false,
  bracketName: null,
};

vi.mock('../../../app/providers/auth-provider', () => ({
  useAuthContext: () => mockAuthContext,
}));

vi.mock('../../../features/auth', () => ({
  signInAnonymously: vi.fn().mockResolvedValue({ uid: 'test-uid' }),
}));

vi.mock('../../../shared/api/api-client', () => ({
  post: vi.fn().mockResolvedValue({ success: true }),
}));

const renderWithRouter = () =>
  render(
    <MemoryRouter>
      <BracketLoginPage />
    </MemoryRouter>,
  );

describe('BracketLoginPage', () => {
  beforeEach(() => {
    mockAuthContext.loading = false;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.isAnonymous = false;
  });

  it('should render the login form', () => {
    renderWithRouter();
    expect(screen.getByText('Movable Madness')).toBeInTheDocument();
    expect(screen.getByText('Join Tournament')).toBeInTheDocument();
    expect(screen.getByLabelText(/bracket name/i)).toBeInTheDocument();
  });

  it('should show warning text about browser persistence', () => {
    renderWithRouter();
    expect(screen.getByText(/same browser/i)).toBeInTheDocument();
  });

  it('should show error when submitting empty bracket name', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Join Tournament'));
    expect(await screen.findByText('Please enter a bracket name')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockAuthContext.loading = true;
    renderWithRouter();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
