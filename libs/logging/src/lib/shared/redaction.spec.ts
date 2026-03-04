import { redact } from './redaction';

describe('redaction', () => {
  it('should redact sensitive keys by default', () => {
    const data = {
      username: 'john',
      password: 'secret123',
      token: 'abc123',
    };
    const result = redact(data);
    expect(result.username).toBe('john');
    expect(result.password).toBe('[REDACTED]');
    expect(result.token).toBe('[REDACTED]');
  });

  it('should handle nested objects', () => {
    const data = {
      user: {
        name: 'john',
        auth: {
          password: 'secret',
        },
      },
    };
    const result = redact(data);
    expect(result.user.name).toBe('john');
    expect(result.user.auth.password).toBe('[REDACTED]');
  });

  it('should redact entire object when field name matches sensitive pattern', () => {
    const data = {
      user: {
        name: 'john',
        credentials: {
          password: 'secret',
        },
      },
    };
    const result = redact(data);
    expect(result.user.name).toBe('john');
    // 'credentials' matches /credential/i pattern, so entire object is redacted
    expect(result.user.credentials).toBe('[REDACTED]');
  });

  it('should handle arrays', () => {
    const data = {
      users: [{ name: 'john', password: 'secret' }],
    };
    const result = redact(data);
    expect(result.users[0].name).toBe('john');
    expect(result.users[0].password).toBe('[REDACTED]');
  });

  it('should redact additional fields when specified', () => {
    const data = { customSecret: 'value', password: 'secret' };
    const result = redact(data, { additionalFields: ['customSecret'] });
    expect(result.customSecret).toBe('[REDACTED]');
    expect(result.password).toBe('[REDACTED]');
  });

  it('should not modify primitives', () => {
    expect(redact('string')).toBe('string');
    expect(redact(123)).toBe(123);
    expect(redact(null)).toBe(null);
  });

  it('should redact values matching additionalValues patterns', () => {
    const data = { note: 'Bearer token123' };
    const result = redact(data, { additionalValues: [/Bearer\s+\S+/] });
    expect(result.note).toBe('[REDACTED]');
  });
});
