import { BracketsService } from './brackets.service';

// Mock firebase-admin/app
jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => [{}]),
  initializeApp: jest.fn(),
  applicationDefault: jest.fn(),
}));

// Mock firebase-admin/firestore
const mockSet = jest.fn();
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockDoc = jest.fn(() => ({
  set: mockSet,
  get: mockGet,
  update: mockUpdate,
  id: 'new-bracket-id',
}));
const mockQueryGet = jest.fn();
const mockLimit = jest.fn(() => ({
  get: mockQueryGet,
}));
const mockWhere = jest.fn(() => ({
  limit: mockLimit,
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  where: mockWhere,
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: mockCollection,
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  },
}));

describe('BracketsService', () => {
  let service: BracketsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BracketsService();
  });

  describe('joinBracket', () => {
    it('should create a new bracket entry when none exists', async () => {
      mockGet.mockResolvedValue({ exists: false });

      const result = await service.joinBracket('user-123', 'My Bracket');

      expect(mockCollection).toHaveBeenCalledWith('bracketEntries');
      expect(mockDoc).toHaveBeenCalledWith('user-123');
      expect(mockSet).toHaveBeenCalledWith(
        {
          bracketName: 'My Bracket',
          createdAt: 'SERVER_TIMESTAMP',
        },
        { merge: false },
      );
      expect(result).toEqual({ isNew: true });
    });

    it('should update an existing bracket entry', async () => {
      mockGet.mockResolvedValue({ exists: true });

      const result = await service.joinBracket('user-456', 'Updated Bracket');

      expect(mockSet).toHaveBeenCalledWith(
        {
          bracketName: 'Updated Bracket',
          updatedAt: 'SERVER_TIMESTAMP',
        },
        { merge: true },
      );
      expect(result).toEqual({ isNew: false });
    });

    it('should trim the bracket name', async () => {
      mockGet.mockResolvedValue({ exists: false });

      await service.joinBracket('user-789', '  Spaced Name  ');

      expect(mockSet).toHaveBeenCalledWith(
        {
          bracketName: 'Spaced Name',
          createdAt: 'SERVER_TIMESTAMP',
        },
        { merge: false },
      );
    });
  });

  describe('findByUserId', () => {
    it('should return the bracket document when one exists', async () => {
      mockQueryGet.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'bracket-abc',
            data: () => ({
              bracketName: 'Test Bracket',
              userId: 'user-123',
              picks: { R1_M0: '1', R1_M1: '2' },
              teams: [],
              createdAt: '2026-03-15T00:00:00Z',
              updatedAt: '2026-03-15T00:00:00Z',
            }),
          },
        ],
      });

      const result = await service.findByUserId('user-123');

      expect(mockCollection).toHaveBeenCalledWith('brackets');
      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-123');
      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        id: 'bracket-abc',
        bracketName: 'Test Bracket',
        userId: 'user-123',
        picks: { R1_M0: '1', R1_M1: '2' },
        teams: [],
        createdAt: '2026-03-15T00:00:00Z',
        updatedAt: '2026-03-15T00:00:00Z',
      });
    });

    it('should return null when no bracket exists for user', async () => {
      mockQueryGet.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const result = await service.findByUserId('user-no-bracket');

      expect(result).toBeNull();
    });
  });

  describe('submitBracket', () => {
    const submission = {
      bracketName: 'Test Bracket',
      picks: { R1_M0: 1, R1_M1: 2 } as Record<string, number | null>,
    };

    it('should create a new bracket when none exists for the user', async () => {
      mockQueryGet.mockResolvedValue({ empty: true, docs: [] });

      const result = await service.submitBracket('user-123', submission);

      expect(mockSet).toHaveBeenCalledWith({
        bracketName: 'Test Bracket',
        userId: 'user-123',
        picks: { R1_M0: '1', R1_M1: '2' },
        teams: [],
        createdAt: 'SERVER_TIMESTAMP',
        updatedAt: 'SERVER_TIMESTAMP',
      });
      expect(result).toBe('new-bracket-id');
    });

    it('should update the existing bracket when one exists', async () => {
      mockQueryGet.mockResolvedValue({
        empty: false,
        docs: [{ id: 'existing-bracket-id', data: () => ({}) }],
      });

      const result = await service.submitBracket('user-456', submission);

      expect(mockDoc).toHaveBeenCalledWith('existing-bracket-id');
      expect(mockUpdate).toHaveBeenCalledWith({
        picks: { R1_M0: '1', R1_M1: '2' },
        updatedAt: 'SERVER_TIMESTAMP',
      });
      expect(result).toBe('existing-bracket-id');
    });
  });
});
