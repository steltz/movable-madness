import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAdminService } from './firebase-admin.service';

// Mock firebase-admin/app to prevent actual initialization
jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => [{}]),
  initializeApp: jest.fn(),
  applicationDefault: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

describe('FirebaseAdminService', () => {
  let service: FirebaseAdminService;

  beforeEach(() => {
    service = new FirebaseAdminService();
  });

  describe('extractUser', () => {
    it('should assign bracket_user role for anonymous sign-in provider', () => {
      const decodedToken = {
        uid: 'anon-uid-123',
        email: undefined,
        firebase: {
          sign_in_provider: 'anonymous',
        },
      } as unknown as DecodedIdToken;

      const user = service.extractUser(decodedToken);

      expect(user).toEqual({
        uid: 'anon-uid-123',
        email: '',
        role: 'bracket_user',
      });
    });

    it('should assign admin role for non-anonymous users without role claim', () => {
      const decodedToken = {
        uid: 'admin-uid-456',
        email: 'admin@example.com',
        firebase: {
          sign_in_provider: 'password',
        },
      } as unknown as DecodedIdToken;

      const user = service.extractUser(decodedToken);

      expect(user).toEqual({
        uid: 'admin-uid-456',
        email: 'admin@example.com',
        role: 'admin',
      });
    });

    it('should use role from custom claims when present', () => {
      const decodedToken = {
        uid: 'user-uid-789',
        email: 'user@example.com',
        role: 'admin',
        firebase: {
          sign_in_provider: 'password',
        },
      } as unknown as DecodedIdToken;

      const user = service.extractUser(decodedToken);

      expect(user).toEqual({
        uid: 'user-uid-789',
        email: 'user@example.com',
        role: 'admin',
      });
    });
  });
});
