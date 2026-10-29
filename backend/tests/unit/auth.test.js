import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

const SECRET = 'test_secret_for_jwt_verification_must_be_32_chars';
const ISSUER = 'k12-crm';
const AUDIENCE = 'k12-crm-admin';

describe('Unit Tests: JWT Auth & Cryptographic Claims', () => {
  it('signs and verifies a valid token with HS256, issuer and audience', () => {
    const payload = { sub: 'admin-123', email: 'admin@k12hunar.com', role: 'admin' };
    const token = jwt.sign(payload, SECRET, {
      algorithm: 'HS256',
      expiresIn: '1h',
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const decoded = jwt.verify(token, SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    expect(decoded.sub).toBe('admin-123');
    expect(decoded.email).toBe('admin@k12hunar.com');
    expect(decoded.iss).toBe(ISSUER);
    expect(decoded.aud).toBe(AUDIENCE);
  });

  it('rejects tokens signed with wrong algorithm', () => {
    const token = jwt.sign({ sub: 'admin-123' }, SECRET, { algorithm: 'HS384' });

    expect(() => {
      jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    }).toThrow();
  });

  it('rejects tokens with wrong issuer', () => {
    const token = jwt.sign({ sub: 'admin-123' }, SECRET, {
      algorithm: 'HS256',
      issuer: 'malicious-issuer',
      audience: AUDIENCE,
    });

    expect(() => {
      jwt.verify(token, SECRET, {
        algorithms: ['HS256'],
        issuer: ISSUER,
        audience: AUDIENCE,
      });
    }).toThrow(/jwt issuer invalid/);
  });

  it('rejects expired tokens', () => {
    const token = jwt.sign({ sub: 'admin-123' }, SECRET, {
      algorithm: 'HS256',
      expiresIn: '-1s',
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    expect(() => {
      jwt.verify(token, SECRET, {
        algorithms: ['HS256'],
        issuer: ISSUER,
        audience: AUDIENCE,
      });
    }).toThrow(/jwt expired/);
  });
});
