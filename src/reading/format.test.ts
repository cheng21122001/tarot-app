import { describe, expect, it } from 'vitest';
import { formatDate, groupByMonth } from './format';

describe('formatDate', () => {
  it('formats local date with dots', () => {
    expect(formatDate(new Date(2026, 8, 5, 23, 30).toISOString())).toBe('2026.09.05');
  });
});

describe('groupByMonth', () => {
  it('splits a newest-first list into local months, keeping order', () => {
    const at = (m: number, d: number) => ({ id: `${m}-${d}`, createdAt: new Date(2026, m, d, 12).toISOString(), updatedAt: '' });
    expect(groupByMonth([at(9, 20), at(9, 3), at(8, 30), at(7, 1)]).map((g) => [g.label, g.items.length])).toEqual([
      ['2026年10月', 2],
      ['2026年9月', 1],
      ['2026年8月', 1],
    ]);
  });
});
