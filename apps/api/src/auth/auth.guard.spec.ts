import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { AuthGuard } from './auth.guard';
import { FirebaseAdminService } from './firebase-admin.service';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let firebaseAdminService: jest.Mocked<FirebaseAdminService>;

  beforeEach(() => {
    firebaseAdminService = {
      verifyIdToken: jest.fn(),
      extractUser: jest.fn(),
    } as unknown as jest.Mocked<FirebaseAdminService>;

    authGuard = new AuthGuard(firebaseAdminService);
  });

  const createMockExecutionContext = (authHeader?: string): ExecutionContext => {
    const mockRequest = {
      headers: {
        authorization: authHeader,
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should throw UnauthorizedException when authorization header is missing', async () => {
      const context = createMockExecutionContext(undefined);

      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when authorization header does not start with Bearer', async () => {
      const context = createMockExecutionContext('Basic token123');

      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      const context = createMockExecutionContext('Bearer invalid-token');
      firebaseAdminService.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should return true and attach user to request when token is valid', async () => {
      const mockDecodedToken = {
        uid: 'test-uid',
        email: 'test@example.com',
        role: 'admin',
      } as unknown as DecodedIdToken;

      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        role: 'admin' as const,
      };

      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      firebaseAdminService.verifyIdToken.mockResolvedValue(mockDecodedToken);
      firebaseAdminService.extractUser.mockReturnValue(mockUser);

      const result = await authGuard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRequest).toHaveProperty('user', mockUser);
      expect(firebaseAdminService.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(firebaseAdminService.extractUser).toHaveBeenCalledWith(mockDecodedToken);
    });
  });
});
