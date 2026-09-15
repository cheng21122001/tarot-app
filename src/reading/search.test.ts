import { describe, expect, it } from 'vitest';
import { formatDate, searchReadings } from './search';
import { newReading } from './types';

const a = { ...newReading(), clientName: '小林', question: '合作还继续吗' };
const b = { ...newReading(), clientName: 'Amy', question: '他会回来吗' };

describe('searchReadings', () => {
  it('returns all for empty query', () => {
    expect(searchReadings([a, b], ' ')).toEqual([a, b]);
  });
  it('matches name or question, case-insensitive', () => {
    expect(searchReadings([a, b], '小林')).toEqual([a]);
    expect(searchReadings([a, b], '回来')).toEqual([b]);
    expect(searchReadings([a, b], 'amy')).toEqual([b]);
  });
});

describe('formatDate', () => {
  it('formats local date with dots', () => {
    const iso = new Date(2026, 8, 5, 23, 30).toISOString();
    expect(formatDate(iso)).toBe('2026.09.05');
  });
});
