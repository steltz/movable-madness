import { useLocation } from 'react-router-dom';

export interface BreadcrumbSegment {
  label: string;
  path: string;
  isCurrentPage: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/brackets': 'Brackets',
  '/brackets/edit': 'Edit Bracket',
  '/admin': 'Admin',
  '/admin/settings': 'Settings',
};

export function useBreadcrumbs(): BreadcrumbSegment[] {
  const { pathname } = useLocation();

  if (pathname === '/') {
    return [];
  }

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: BreadcrumbSegment[] = [];

  segments.forEach((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;
    const label = ROUTE_LABELS[path] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ label, path, isCurrentPage: isLast });
  });

  return crumbs;
}
