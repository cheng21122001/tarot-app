import { describe, expect, it } from 'vitest';
import { fontCssUrl, fontSubsetChars } from './font';

describe('font subset', () => {
  it('dedupes characters, drops whitespace and always includes basics', () => {
    const chars = fontSubsetChars('塔 塔\n罗');
    expect(chars.startsWith('塔罗')).toBe(true);
    expect(chars.match(/塔/g)).toHaveLength(1);
    expect(chars).not.toMatch(/\s/);
    expect(chars).toContain('·');
    expect(chars).toContain('R');
  });

  it('builds a Google Fonts css2 url with both weights', () => {
    const url = fontCssUrl('塔罗');
    expect(url).toBe('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600&text=%E5%A1%94%E7%BD%97');
  });
});
