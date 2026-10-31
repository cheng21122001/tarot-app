import { describe, expect, it } from 'vitest';
import type { BirthInfo } from '../domain/types';
import { buildChart, pillarsText, shiShen, switchCalendar, today, wuXingText, wxKey } from './chart';

const base: BirthInfo = { calendar: 'solar', date: '1998-03-12', leapMonth: false, time: '14:30', gender: 'female' };

describe('shiShen', () => {
  it('matches the classic table for 戊 day master', () => {
    expect(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].map((g) => shiShen('戊', g))).toEqual([
      '七杀', '正官', '偏印', '正印', '比肩', '劫财', '食神', '伤官', '偏财', '正财',
    ]);
  });
});

describe('buildChart', () => {
  it('builds four pillars with hidden stems, na yin and di shi', () => {
    const c = buildChart(base, 2026)!;
    expect(pillarsText(c)).toBe('戊寅 乙卯 戊午 己未');
    expect(c.dayMaster).toBe('戊土');
    expect(c.pillars.map((p) => p.ganShiShen)).toEqual(['比肩', '正官', '日主', '劫财']);
    expect(c.pillars[0].hidden).toEqual([
      { gan: '甲', shiShen: '七杀' },
      { gan: '丙', shiShen: '偏印' },
      { gan: '戊', shiShen: '比肩' },
    ]);
    expect(c.pillars.map((p) => p.naYin)).toEqual(['城头土', '大溪水', '天上火', '天上火']);
    expect(c.pillars.map((p) => p.diShi)).toEqual(['长生', '沐浴', '帝旺', '衰']);
    expect(c.kongWang).toBe('子丑');
    expect(c.mingGong).toBe('己未');
    expect(wuXingText(c)).toBe('木3 火1 土4 金0 水0');
    expect(c.lunarText).toBe('农历 一九九八年二月十四');
  });

  it('finds da yun, liu nian and liu yue for the target year', () => {
    const c = buildChart(base, 2027)!;
    expect(c.currentDaYun).toMatchObject({ ganZhi: '壬子', shiShen: '偏财', startYear: 2020, endYear: 2029, startAge: 23 });
    expect(c.liuNian).toEqual({ ganZhi: '丁未', shiShen: '正印' });
    expect(c.liuYue).toHaveLength(12);
    expect(c.liuYue[0]).toEqual({ ganZhi: '壬寅', shiShen: '偏财', jie: '立春', start: '2/4' });
    expect(c.liuYue[11]).toMatchObject({ ganZhi: '癸丑', jie: '小寒', start: '1/6' });
  });

  it('runs da yun the other way for a man born in a yang year', () => {
    expect(buildChart({ ...base, gender: 'male' }, 2026)!.daYun[0].ganZhi).toBe('丙辰');
  });

  it('drops the hour pillar and ming gong when time is unknown', () => {
    const c = buildChart({ ...base, time: null }, 2026)!;
    expect(c.pillars).toHaveLength(3);
    expect(c.mingGong).toBeNull();
    expect(pillarsText(c)).toBe('戊寅 乙卯 戊午（时辰不详）');
  });

  it('converts lunar dates, including leap months', () => {
    expect(buildChart({ ...base, calendar: 'lunar', date: '1998-02-14' }, 2026)!.solarText).toBe('公历 1998年3月12日 14:30');
    expect(buildChart({ ...base, calendar: 'lunar', date: '1998-05-03', leapMonth: true, time: null }, 2026)!.solarText).toBe('公历 1998年6月26日（时辰不详）');
  });

  it('rejects invalid dates', () => {
    expect(buildChart({ ...base, date: '1998-02-30' }, 2026)).toBeNull();
    expect(buildChart({ ...base, date: '' }, 2026)).toBeNull();
    expect(buildChart({ ...base, date: '1800-01-01' }, 2026)).toBeNull();
    expect(buildChart({ ...base, calendar: 'lunar', date: '1998-04-03', leapMonth: true }, 2026)).toBeNull();
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

describe('wxKey and today', () => {
  it('maps stems and branches to element keys', () => {
    expect(['甲', '丁', '戊', '辛', '癸', '寅', '午', '丑', '酉', '子', 'x'].map(wxKey)).toEqual(['wood', 'fire', 'earth', 'metal', 'water', 'wood', 'fire', 'earth', 'metal', 'water', null]);
  });
  it('gives today in gan zhi', () => {
    expect(today(new Date(2026, 9, 31))).toEqual({ ganZhi: ['丙午', '戊戌', '戊寅'], lunar: '农历九月廿二' });
  });
});
