import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppLayout } from './app-layout';

const mockAuthContext = {
  user: null,
  firebaseUser: null,
  loading: false,
  isAuthenticated: false,
  isAnonymous: false,
  bracketName: null,
};

vi.mock('../providers/auth-provider', () => ({
  useAuthContext: () => mockAuthContext,
}));

vi.mock('../../features/app-bar/app-bar', () => ({
  AppBar: () => <div>Movable Madness</div>,
}));

const renderWithRoute = (path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>Home Content</div>} />
          <Route path="/brackets" element={<div>Brackets Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('AppLayout', () => {
  beforeEach(() => {
    mockAuthContext.user = null;
    mockAuthContext.loading = false;
    mockAuthContext.isAuthenticated = false;
    mockAuthContext.isAnonymous = false;
  });

  it('should render app bar and outlet when authenticated', () => {
    mockAuthContext.isAuthenticated = true;
    mockAuthContext.user = { uid: 'test', role: 'admin' as const };
    renderWithRoute('/');
    expect(screen.getByText('Movable Madness')).toBeInTheDocument();
    expect(screen.getByText('Home Content')).toBeInTheDocument();
  });

  it('should render only outlet when not authenticated', () => {
    renderWithRoute('/');
    expect(screen.queryByText('Movable Madness')).not.toBeInTheDocument();
    expect(screen.getByText('Home Content')).toBeInTheDocument();
  });

  it('should render only outlet when loading', () => {
    mockAuthContext.loading = true;
    renderWithRoute('/');
    expect(screen.queryByText('Movable Madness')).not.toBeInTheDocument();
    expect(screen.getByText('Home Content')).toBeInTheDocument();
  });
});
