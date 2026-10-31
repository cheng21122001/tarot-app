import { describe, expect, it } from 'vitest';
import type { BirthInfo } from '../reading/types';
import { buildChart, pillarsText, switchCalendar, wuXingText } from './chart';

const at = new Date(2026, 9, 31, 12);
const base: BirthInfo = { calendar: 'solar', date: '1998-03-12', leapMonth: false, time: '14:30', gender: 'male' };

describe('buildChart', () => {
  it('builds four pillars, day master and wuxing counts', () => {
    const c = buildChart(base, at)!;
    expect(pillarsText(c)).toBe('戊寅 乙卯 戊午 己未');
    expect(c.dayMaster).toBe('戊土');
    expect(c.pillars.map((p) => p.shiShen)).toEqual(['比肩', '正官', '日主', '劫财']);
    expect(wuXingText(c)).toBe('金0 木3 水0 火1 土4');
    expect(c.lunarText).toBe('农历 一九九八年二月十四');
  });

  it('finds the current da yun and liu nian', () => {
    const c = buildChart(base, at)!;
    expect(c.currentDaYun?.ganZhi).toBe('戊午');
    expect(c.liuNian).toEqual({ year: 2026, ganZhi: '丙午' });
  });

  it('drops the hour pillar when time is unknown', () => {
    const c = buildChart({ ...base, time: null }, at)!;
    expect(c.pillars).toHaveLength(3);
    expect(pillarsText(c)).toBe('戊寅 乙卯 戊午（时辰不详）');
  });

  it('converts lunar dates, including leap months', () => {
    expect(buildChart({ ...base, calendar: 'lunar', date: '1998-02-14' }, at)!.solarText).toBe('公历 1998年3月12日 14:30');
    expect(buildChart({ ...base, calendar: 'lunar', date: '1998-05-03', leapMonth: true, time: null }, at)!.solarText).toBe('公历 1998年6月26日');
  });

  it('rejects invalid dates', () => {
    expect(buildChart({ ...base, date: '1998-02-30' }, at)).toBeNull();
    expect(buildChart({ ...base, date: '' }, at)).toBeNull();
    expect(buildChart({ ...base, calendar: 'lunar', date: '1998-04-03', leapMonth: true }, at)).toBeNull();
  });
});

describe('switchCalendar', () => {
  it('converts both ways and keeps leap months', () => {
    const lunar = switchCalendar({ ...base, date: '1998-06-26' }, 'lunar');
    expect(lunar).toMatchObject({ calendar: 'lunar', date: '1998-05-03', leapMonth: true });
    expect(switchCalendar(lunar, 'solar')).toMatchObject({ calendar: 'solar', date: '1998-06-26', leapMonth: false });
  });
  it('just flips the flag for an incomplete date', () => {
    expect(switchCalendar({ ...base, date: '' }, 'lunar')).toMatchObject({ calendar: 'lunar', date: '' });
  });
});
