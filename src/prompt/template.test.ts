import { describe, expect, it } from 'vitest';
import { buildChart } from '../bazi/chart';
import { newClient, newReading, type Client } from '../domain/types';
import { buildPrompt } from './template';

const client: Client = { ...newClient(), name: '小林', birth: { calendar: 'solar', date: '1998-03-12', leapMonth: false, time: '14:30', gender: 'female' } };

describe('buildPrompt', () => {
  it('builds a natal prompt with the full chart and seven headings', () => {
    const r = { ...newReading(client, 'natal', 2026), schools: [] };
    const p = buildPrompt(r, client, buildChart(client.birth, 2026)!);
    expect(p).toContain('命盘总论');
    expect(p).toContain('客人称呼：小林');
    expect(p).toContain('四柱：戊寅 乙卯 戊午 己未');
    expect(p).toContain('年柱 戊寅：天干戊（比肩），地支寅藏甲（七杀）丙（偏印）戊（比肩），纳音城头土，星运长生');
    expect(p).toContain('当前（2026年）：大运 壬子偏财运（2020–2029，虚岁23起），流年 丙午（天干偏印）');
    expect(p).toContain('【命局总览】\n【性格特点】\n【事业学业】\n【财运】\n【感情婚姻】\n【大运走势】\n【建议】');
    expect(p).not.toContain('流月');
    expect(p).toContain('不要在正文里写免责声明');
  });

  it('builds a year prompt with liu yue and the focus', () => {
    const r = { ...newReading(client, 'year', 2027), focus: '明年适合换工作吗' };
    const p = buildPrompt(r, client, buildChart(client.birth, 2027)!);
    expect(p).toContain('2027年流年运势');
    expect(p).toContain('要看的流年：2027年 丁未（天干正印）');
    expect(p).toContain('  寅月 壬寅（偏财），立春 2/4 起');
    expect(p).toContain('客人特别想了解：明年适合换工作吗');
    expect(p).toContain('【逐月提示】');
  });

  it('notes an unknown hour', () => {
    const c = { ...client, birth: { ...client.birth, time: null } };
    const p = buildPrompt(newReading(c, 'natal', 2026), c, buildChart(c.birth, 2026)!);
    expect(p).toContain('时辰不详');
    expect(p).not.toContain('时柱 ');
    expect(p).not.toContain('命宫');
  });
});

describe('buildPrompt with schools', () => {
  const chart = buildChart(client.birth, 2026)!;

  it('lists each chosen school with its method and asks for a comparison', () => {
    const p = buildPrompt({ ...newReading(client, 'natal', 2026), schools: ['geju', 'tiaohou'] }, client, chart);
    expect(p).toContain('这次用 格局派、调候派 来看');
    expect(p).toContain('《子平真诠》');
    expect(p).toContain('《穷通宝鉴》中此日干生于此月的调候用神');
    expect(p).not.toContain('《滴天髓》');
    expect(p).toContain('【格局派：成就与方向】\n【调候派：心态与状态】\n【两派对照】\n【性格特点】');
    expect(p).toContain('全文 2300 到 3000 字');
    expect(p).toContain('月令：卯月 仲春');
  });

  it('drops the comparison for a single school', () => {
    const p = buildPrompt({ ...newReading(client, 'year', 2027), schools: ['tiaohou'] }, client, buildChart(client.birth, 2027)!);
    expect(p).toContain('【年度总览】\n【调候派看这一年】\n【事业】');
    expect(p).not.toContain('对照');
  });

  it('keeps the old prompt for readings made before schools existed', () => {
    const p = buildPrompt({ ...newReading(client, 'natal', 2026), schools: [] }, client, chart);
    expect(p).not.toContain('流派');
    expect(p).toContain('【命局总览】');
  });
});
