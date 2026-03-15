import { generateCorrelationId, isValidCorrelationId } from './correlation';

describe('correlation', () => {
  describe('generateCorrelationId', () => {
    it('should generate a valid UUID v4', () => {
      const id = generateCorrelationId();
      expect(isValidCorrelationId(id)).toBe(true);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateCorrelationId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('isValidCorrelationId', () => {
    it('should return true for valid UUID v4', () => {
      expect(isValidCorrelationId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidCorrelationId('6ba7b810-9dad-41d4-80b5-0c0a98e6eea1')).toBe(true);
    });

    it('should return false for invalid UUIDs', () => {
      expect(isValidCorrelationId('')).toBe(false);
      expect(isValidCorrelationId('not-a-uuid')).toBe(false);
      expect(isValidCorrelationId('550e8400-e29b-31d4-a716-446655440000')).toBe(false); // version 3, not 4
    });
  });
});
