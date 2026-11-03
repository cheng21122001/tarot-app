import { describe, expect, it } from 'vitest';
import { ascendant, localToUtc, planetPositions, tzOffsetMinutes } from './astro';
import reference from './swisseph-reference.json';

// 参考值由 Swiss Ephemeris（pyswisseph 2.10，Lahiri，整宫制，平均交点）算出，覆盖 1950–2040 年、南北半球、东西经。
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe('planet positions against Swiss Ephemeris', () => {
  for (const c of reference) {
    it(`${c.utc} at ${c.lat},${c.lon}`, () => {
      const date = new Date(c.utc);
      for (const p of planetPositions(date)) {
        expect(diff(p.lon, c.planets[p.id as keyof typeof c.planets]), p.id).toBeLessThan(0.02);
        if (p.id !== 'ketu') expect(p.retro, `${p.id} retro`).toBe(c.retro[p.id as keyof typeof c.retro]);
      }
      expect(diff(ascendant(date, c.lat, c.lon), c.asc), 'ascendant').toBeLessThan(0.02);
    });
  }
});

describe('time zones', () => {
  it('applies China daylight saving time in 1988', () => {
    expect(localToUtc(1988, 6, 1, 10, 20, 'Asia/Shanghai').toISOString()).toBe('1988-06-01T01:20:00.000Z');
    expect(localToUtc(1988, 12, 1, 10, 20, 'Asia/Shanghai').toISOString()).toBe('1988-12-01T02:20:00.000Z');
  });

  it('handles half-hour zones and the western hemisphere', () => {
    expect(tzOffsetMinutes('Asia/Kolkata', new Date('2000-01-01T00:00:00Z'))).toBe(330);
    expect(localToUtc(2012, 7, 4, 20, 0, 'America/New_York').toISOString()).toBe('2012-07-05T00:00:00.000Z');
  });
});
