import { describe, expect, it } from 'vitest';
import { authErrorKey, newPasswordInput, safeNext, signUpInput } from '@/lib/auth/schemas';

describe('auth input rules (shared by forms and server)', () => {
  it('e-mail is trimmed and lower-cased; short passwords are refused', () => {
    expect(signUpInput.parse({ email: ' Jonas@Example.LT ', password: '12345678' }).email).toBe('jonas@example.lt');
    expect(signUpInput.safeParse({ email: 'jonas@example.lt', password: '1234567' }).success).toBe(false);
    expect(signUpInput.safeParse({ email: 'ne-pastas', password: '12345678' }).success).toBe(false);
  });
  it('new password must be repeated', () => {
    expect(newPasswordInput.safeParse({ password: 'slaptas123', repeat: 'slaptas124' }).success).toBe(false);
  });
});

describe('redirect after sign-in stays on this site', () => {
  it.each([
    ['/paskyra', '/paskyra'],
    ['/ru/paskyra', '/ru/paskyra'],
    ['https://evil.example', '/paskyra'],
    ['//evil.example', '/paskyra'],
    ['/\\evil.example', '/paskyra'],
    [null, '/paskyra'],
  ])('%s → %s', (input, out) => expect(safeNext(input)).toBe(out));
});

describe('Supabase errors become friendly messages', () => {
  it('maps the common cases', () => {
    expect(authErrorKey({ code: 'invalid_credentials' })).toBe('invalidCredentials');
    expect(authErrorKey({ message: 'Email not confirmed' })).toBe('emailNotConfirmed');
    expect(authErrorKey({ status: 429, message: 'x' })).toBe('rateLimited');
    expect(authErrorKey({ message: 'something else' })).toBe('unknown');
  });
});
