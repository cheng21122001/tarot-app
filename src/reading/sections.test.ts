import { describe, expect, it } from 'vitest';
import { sectionsFor } from './sections';

describe('sectionsFor', () => {
  it('keeps the old layout for readings without schools', () => {
    expect(sectionsFor('natal', [])[0]).toBe('命局总览');
  });
  it('adds one section per school plus a comparison, in a fixed order', () => {
    expect(sectionsFor('natal', ['tiaohou', 'geju'])).toEqual([
      '格局派：成就与方向', '调候派：心态与状态', '两派对照', '性格特点', '事业学业', '财运', '感情婚姻', '大运走势', '建议',
    ]);
    expect(sectionsFor('year', ['geju', 'tiaohou', 'fuyi']).slice(0, 5)).toEqual(['年度总览', '格局派看这一年', '调候派看这一年', '扶抑派看这一年', '几派对照']);
  });
  it('skips the comparison for a single school', () => {
    expect(sectionsFor('natal', ['tiaohou'])).not.toContain('两派对照');
  });
});
