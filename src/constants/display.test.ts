import { EM_DASH, EN_DASH, HYPHEN, MINUS } from '@constants/display';
import { describe, expect, it } from 'vitest';

describe('display constants', () => {
  it('EM_DASH is U+2014', () => {
    expect(EM_DASH).toBe('\u2014');
  });

  it('EN_DASH is U+2013', () => {
    expect(EN_DASH).toBe('\u2013');
  });

  it('HYPHEN is U+002D', () => {
    expect(HYPHEN).toBe('-');
  });

  it('MINUS is U+2212', () => {
    expect(MINUS).toBe('\u2212');
  });
});
