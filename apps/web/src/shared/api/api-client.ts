import { getIdToken } from '../../features/auth';

const API_BASE_URL = '/api';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * Authenticated API client that automatically injects Firebase ID token.
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: customHeaders, ...restOptions } = options;

  // Get auth token if available
  const token = await getIdToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * GET request with auth.
 */
export function get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request with auth.
 */
export function post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT request with auth.
 */
export function put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'PUT', body });
}

/**
 * DELETE request with auth.
 */
export function del<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
}
