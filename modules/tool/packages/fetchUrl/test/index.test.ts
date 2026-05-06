import { describe, expect, it } from 'vitest';
import { isInternalAddress } from '../src';

describe('fetchUrl isInternalAddress', () => {
  it('should not mark public IPv4 as internal', () => {
    expect(isInternalAddress('http://115.238.95.70:38000')).toBe(false);
  });

  it('should mark private IPv4 as internal', () => {
    expect(isInternalAddress('http://192.168.1.20:8080')).toBe(true);
  });
});
