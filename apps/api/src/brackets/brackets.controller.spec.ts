import type { AuthUser } from '@movable-madness/auth';
import { BadRequestException } from '@nestjs/common';
import { BracketsController } from './brackets.controller';
import { BracketsService } from './brackets.service';

describe('BracketsController', () => {
  let controller: BracketsController;
  let service: jest.Mocked<BracketsService>;

  beforeEach(() => {
    service = {
      joinBracket: jest.fn(),
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<BracketsService>;
    controller = new BracketsController(service);
  });

  const mockUser: AuthUser = {
    uid: 'user-123',
    email: undefined,
    role: 'bracket_user',
  };

  describe('join', () => {
    it('should create a bracket entry and return success', async () => {
      service.joinBracket.mockResolvedValue({ isNew: true });

      const result = await controller.join(mockUser, { bracketName: 'My Bracket' });

      expect(service.joinBracket).toHaveBeenCalledWith('user-123', 'My Bracket');
      expect(result).toEqual({
        success: true,
        data: { bracketName: 'My Bracket' },
      });
    });

    it('should reject empty bracket name', async () => {
      await expect(controller.join(mockUser, { bracketName: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject whitespace-only bracket name', async () => {
      await expect(controller.join(mockUser, { bracketName: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject bracket name longer than 50 characters', async () => {
      const longName = 'a'.repeat(51);
      await expect(controller.join(mockUser, { bracketName: longName })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMyBracket', () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as import('express').Response;

    it('should return the bracket when one exists', async () => {
      const bracket = {
        id: 'bracket-abc',
        bracketName: 'My Bracket',
        userId: 'user-123',
        picks: { R1_M0: '1' },
        teams: [],
        createdAt: '2026-03-15T00:00:00Z',
        updatedAt: '2026-03-15T00:00:00Z',
      };
      service.findByUserId.mockResolvedValue(bracket);

      await controller.getMyBracket(mockUser, mockRes);

      expect(service.findByUserId).toHaveBeenCalledWith('user-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: bracket,
        }),
      );
    });

    it('should return 404 when no bracket exists', async () => {
      service.findByUserId.mockResolvedValue(null);

      await controller.getMyBracket(mockUser, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: { code: 'BRACKET_NOT_FOUND', message: 'Bracket not found' },
        }),
      );
    });
  });
});
