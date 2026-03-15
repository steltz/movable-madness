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
});
