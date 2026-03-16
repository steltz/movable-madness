import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useBreadcrumbs } from './use-breadcrumbs';

function renderWithRouter(initialPath: string) {
  return renderHook(() => useBreadcrumbs(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
    ),
  });
}

describe('useBreadcrumbs', () => {
  it('should return empty array for root path', () => {
    const { result } = renderWithRouter('/');
    expect(result.current).toEqual([]);
  });

  it('should return Brackets for /brackets', () => {
    const { result } = renderWithRouter('/brackets');
    expect(result.current).toEqual([{ label: 'Brackets', path: '/brackets', isCurrentPage: true }]);
  });

  it('should return Brackets and Edit Bracket for /brackets/edit', () => {
    const { result } = renderWithRouter('/brackets/edit');
    expect(result.current).toEqual([
      { label: 'Brackets', path: '/brackets', isCurrentPage: false },
      { label: 'Edit Bracket', path: '/brackets/edit', isCurrentPage: true },
    ]);
  });

  it('should return Admin for /admin', () => {
    const { result } = renderWithRouter('/admin');
    expect(result.current).toEqual([{ label: 'Admin', path: '/admin', isCurrentPage: true }]);
  });

  it('should return Admin and Settings for /admin/settings', () => {
    const { result } = renderWithRouter('/admin/settings');
    expect(result.current).toEqual([
      { label: 'Admin', path: '/admin', isCurrentPage: false },
      { label: 'Settings', path: '/admin/settings', isCurrentPage: true },
    ]);
  });

  it('should use capitalized segment name for unknown paths', () => {
    const { result } = renderWithRouter('/unknown');
    expect(result.current).toEqual([{ label: 'Unknown', path: '/unknown', isCurrentPage: true }]);
  });
});
