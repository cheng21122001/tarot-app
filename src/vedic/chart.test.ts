import { describe, expect, it } from 'vitest';
import type { BirthInfo } from '../domain/types';
import { buildVedicChart, NAKSHATRAS, PLANET_NAMES, saturnFromMoon, SIGNS } from './chart';

const chengdu = { name: '成都', lat: 30.57, lon: 104.07, tz: 'Asia/Shanghai' };
const base: BirthInfo = { calendar: 'solar', date: '1988-06-01', leapMonth: false, time: '09:20', gender: 'female', place: chengdu };
const now = new Date('2026-11-03T00:00:00Z');

describe('buildVedicChart', () => {
  it('needs a birth place', () => {
    expect(buildVedicChart({ ...base, place: null }, 2026, now)).toBeNull();
    expect(buildVedicChart({ ...base, place: { ...chengdu, tz: 'Not/AZone' } }, 2026, now)).toBeNull();
  });

  it('builds the natal chart with whole-sign houses', () => {
    const c = buildVedicChart(base, 2026, now)!;
    expect(c.utcText).toBe('1988-06-01 00:20 UTC'); // 当年夏令时，UTC+9
    expect(SIGNS[c.lagna!.sign]).toBe('双子');
    expect(SIGNS[c.moon.sign]).toBe('天蝎');
    expect(NAKSHATRAS[c.moon.nak][0]).toBe('Jyeshtha');
    const byId = Object.fromEntries(c.planets.map((p) => [p.id, p]));
    expect(byId.moon.dignity).toBe('落陷');
    expect(byId.mercury.dignity).toBe('入庙');
    expect(byId.mercury.retro).toBe(true);
    expect(byId.sun.house).toBe(12);
    expect(byId.mercury.house).toBe(1);
    expect((byId.ketu.lon - byId.rahu.lon + 360) % 360).toBeCloseTo(180, 6);
  });

  it('starts Vimshottari from the moon nakshatra lord and keeps periods contiguous', () => {
    const c = buildVedicChart(base, 2026, now)!;
    // Jyeshtha 归水星；月亮在宿内走过约 57%，水星大运还剩约 7 年 3 个月。
    expect(c.mahadashas[0].lord).toBe('mercury');
    expect(c.dashaBalance).toBe('出生时水星大运还剩 7 年 3 个月');
    expect(c.mahadashas.map((d) => d.lord).slice(0, 4)).toEqual(['mercury', 'ketu', 'venus', 'sun']);
    for (let i = 1; i < c.mahadashas.length; i++) expect(c.mahadashas[i].start.getTime()).toBe(c.mahadashas[i - 1].end.getTime());
    expect(PLANET_NAMES[c.currentMd!.lord]).toBe('太阳');
    expect(c.antardashas[0].lord).toBe('sun');
    expect(c.antardashas[8].end.getTime()).toBeCloseTo(c.currentMd!.end.getTime(), -2);
    expect(c.currentAd!.lord).toBe('mercury');
  });

  it('lists slow transits and solar months for the year', () => {
    const c = buildVedicChart(base, 2026, now)!;
    expect(c.transits.jupiter.map((s) => SIGNS[s.sign])).toEqual(['双子', '巨蟹', '狮子']);
    expect(c.transits.saturn.map((s) => s.fromMoon)).toEqual([5]);
    expect(c.transits.rahu.map((s) => SIGNS[s.sign])).toEqual(['水瓶', '摩羯']);
    expect(c.solarMonths).toHaveLength(12);
    expect(SIGNS[c.solarMonths[0].sign]).toBe('摩羯');
    expect(c.solarMonths[0].start.toISOString().slice(0, 10)).toBe('2026-01-14');
  });

  it('falls back to the moon sign as the first house when the time is unknown', () => {
    const c = buildVedicChart({ ...base, time: null }, 2026, now)!;
    expect(c.lagna).toBeNull();
    expect(c.houseBase).toBe('moon');
    expect(c.moon.house).toBe(1);
  });

  it('converts lunar birth dates', () => {
    const solar = buildVedicChart(base, 2026, now)!;
    const lunar = buildVedicChart({ ...base, calendar: 'lunar', date: '1988-04-17' }, 2026, now)!;
    expect(lunar.utcText).toBe(solar.utcText);
  });
});

describe('saturnFromMoon', () => {
  it('names sade sati phases', () => {
    expect(saturnFromMoon(12)).toContain('第一阶段');
    expect(saturnFromMoon(1)).toContain('最重');
    expect(saturnFromMoon(5)).toBeNull();
  });
});
