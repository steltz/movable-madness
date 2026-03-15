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
const mockDoc = jest.fn(() => ({
  set: mockSet,
  get: mockGet,
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
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
});
