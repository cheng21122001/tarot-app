import { describe, expect, it } from 'vitest';
import { newClient, newReading, type Client } from '../domain/types';
import { buildVedicChart } from '../vedic/chart';
import { buildVedicPrompt } from './vedic';

const client: Client = {
  ...newClient(),
  name: '小林',
  birth: { calendar: 'solar', date: '1988-06-01', leapMonth: false, time: '09:20', gender: 'female', place: { name: '成都', lat: 30.57, lon: 104.07, tz: 'Asia/Shanghai' } },
};
const now = new Date('2026-11-03T00:00:00Z');

describe('buildVedicPrompt', () => {
  it('builds a natal prompt with the chart, houses, dashas and seven headings', () => {
    const r = newReading(client, 'natal', 2026, now, 'vedic');
    const p = buildVedicPrompt(r, client, buildVedicChart(client.birth, 2026, now)!);
    expect(p).toContain('吠陀占星师');
    expect(p).toContain('命主称呼：小林');
    expect(p).toContain('出生：1988年6月1日 09:20，出生地 成都（北纬30.57°，东经104.07°，UTC+9），即 1988-06-01 00:20 UTC');
    expect(p).toContain('上升（Lagna）：双子（Mithuna）');
    expect(p).toContain('月亮星座（Rashi）：天蝎（Vrishchika）；月宿（Janma Nakshatra）：Jyeshtha（心宿）');
    expect(p).toMatch(/月亮：天蝎（Vrishchika） 24°\d\d′，第6宫，Jyeshtha（心宿）\d足，D9 \S+，落陷/);
    expect(p).toContain('第1宫 双子，宫主水星落第1宫；宫内：水星、金星');
    expect(p).toContain('出生时水星大运还剩 7 年 3 个月');
    expect(p).toContain('【星盘总览】\n【性格与心性】\n【事业学业】\n【财富】\n【感情婚姻】\n【大运走势】\n【建议】');
    expect(p).not.toContain('太阳月');
    expect(p).not.toContain('时辰不详');
  });

  it('builds a year prompt with dashas, transits and solar months', () => {
    const r = newReading(client, 'year', 2026, now, 'vedic');
    const p = buildVedicPrompt(r, client, buildVedicChart(client.birth, 2026, now)!);
    expect(p).toContain('要看的年份：2026年');
    expect(p).toContain('太阳大运 / 水星（2026-07-17 至 2027-05-24）');
    expect(p).toMatch(/土星：1\/1 起 双鱼（第10宫、月亮起第5宫）/);
    expect(p).toContain('1/14 太阳入摩羯');
    expect(p).toContain('【逐月提示】');
  });

  it('warns about an unknown birth time', () => {
    const c2 = { ...client, birth: { ...client.birth, time: null } };
    const r = newReading(c2, 'natal', 2026, now, 'vedic');
    const p = buildVedicPrompt(r, c2, buildVedicChart(c2.birth, 2026, now)!);
    expect(p).toContain('以月亮所在星座为第一宫');
    expect(p).toContain('命主时辰不详');
  });
});
