import { describe, expect, it } from 'vitest';
import { formatDate, groupByMonth, searchReadings } from './search';
import { newReading } from './types';

const a = { ...newReading(), clientName: '小林', question: '合作还继续吗' };
const b = { ...newReading(), clientName: 'Amy', question: '他会回来吗', cards: [{ id: 'major-16', reversed: true }, null, null] as typeof a.cards };

describe('searchReadings', () => {
  it('returns all for empty query', () => {
    expect(searchReadings([a, b], ' ')).toEqual([a, b]);
  });
  it('matches name or question, case-insensitive', () => {
    expect(searchReadings([a, b], '小林')).toEqual([a]);
    expect(searchReadings([a, b], '回来')).toEqual([b]);
    expect(searchReadings([a, b], 'amy')).toEqual([b]);
  });
  it('matches drawn card names', () => {
    expect(searchReadings([a, b], '塔')).toEqual([b]);
  });
});

describe('groupByMonth', () => {
  it('splits a newest-first list into local months, keeping order', () => {
    const at = (m: number, d: number) => ({ ...newReading(), createdAt: new Date(2026, m, d, 12).toISOString() });
    const list = [at(9, 20), at(9, 3), at(8, 30), at(7, 1)];
    expect(groupByMonth(list).map((g) => [g.label, g.items.length])).toEqual([
      ['2026年10月', 2],
      ['2026年9月', 1],
      ['2026年8月', 1],
    ]);
  });
});

describe('formatDate', () => {
  it('formats local date with dots', () => {
    const iso = new Date(2026, 8, 5, 23, 30).toISOString();
    expect(formatDate(iso)).toBe('2026.09.05');
  });
});
