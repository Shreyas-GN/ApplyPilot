import { describe, expect, it } from 'vitest';
import { extractBearerToken, hashExtensionToken } from './extension';

describe('extension auth helpers', () => {
  it('produces deterministic SHA-256 hex hashes for pairing tokens', () => {
    const a = hashExtensionToken('ap_ext_sample123');
    const b = hashExtensionToken('ap_ext_sample123');
    const c = hashExtensionToken('ap_ext_other456');

    expect(a).toHaveLength(64);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('extracts Bearer tokens case-insensitively and rejects malformed headers', () => {
    expect(extractBearerToken('Bearer ap_ext_abc123')).toBe('ap_ext_abc123');
    expect(extractBearerToken('bearer   ap_ext_abc123  ')).toBe('ap_ext_abc123');
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken('')).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
  });
});

