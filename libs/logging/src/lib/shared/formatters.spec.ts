import { formatAsJson, formatAsPretty, formatLogEntry } from './formatters';
import type { LogEntry } from './types';

describe('formatters', () => {
  const baseEntry: LogEntry = {
    severity: 'INFO',
    message: 'Test message',
    timestamp: '2024-01-15T12:00:00.000Z',
    service: 'test-service',
  };

  describe('formatAsJson', () => {
    it('should return valid JSON string', () => {
      const result = formatAsJson(baseEntry);
      const parsed = JSON.parse(result);
      expect(parsed.severity).toBe('INFO');
      expect(parsed.message).toBe('Test message');
      expect(parsed.service).toBe('test-service');
    });
  });

  describe('formatAsPretty', () => {
    it('should include timestamp and severity', () => {
      const result = formatAsPretty(baseEntry);
      expect(result).toContain('INFO');
      expect(result).toContain('Test message');
      expect(result).toContain('test-service');
    });

    it('should include correlation ID when present', () => {
      const entry: LogEntry = {
        ...baseEntry,
        correlationId: '12345678-1234-1234-1234-123456789012',
      };
      const result = formatAsPretty(entry);
      expect(result).toContain('12345678');
    });

    it('should include error info when present', () => {
      const entry: LogEntry = {
        ...baseEntry,
        error: {
          name: 'TestError',
          message: 'Something went wrong',
          stack: 'Error: Something went wrong\n    at test.ts:1:1',
        },
      };
      const result = formatAsPretty(entry);
      expect(result).toContain('TestError');
      expect(result).toContain('Something went wrong');
    });
  });

  describe('formatLogEntry', () => {
    it('should return JSON format when specified', () => {
      const result = formatLogEntry(baseEntry, 'json');
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should return pretty format when specified', () => {
      const result = formatLogEntry(baseEntry, 'pretty');
      expect(result).toContain('INFO');
      expect(result).not.toContain('"severity"');
    });
  });
});
