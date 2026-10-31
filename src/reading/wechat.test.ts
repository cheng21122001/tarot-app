import { describe, expect, it } from 'vitest';
import { buildChart } from '../bazi/chart';
import { newClient, newReading, type Client } from '../domain/types';
import { toWechatText } from './wechat';

const client: Client = { ...newClient(), name: '小林', birth: { calendar: 'solar', date: '1998-03-12', leapMonth: false, time: '14:30', gender: 'female' } };
const r = newReading(client, 'natal', 2026);
const chart = buildChart(client.birth, 2026)!;
const parsed = { kind: 'sections' as const, sections: [{ title: '甲', body: '一' }, { title: '乙', body: '二' }] };

describe('toWechatText', () => {
  it('ends with the signature when there is one', () => {
    expect(toWechatText(r, client, chart, parsed, ' 小艾 ')).toBe('小林 · 命盘总论\n八字：戊寅 乙卯 戊午 己未（日主戊土）\n\n甲\n一\n——\n乙\n二\n\n小艾');
  });
  it('leaves the signature out when empty', () => {
    expect(toWechatText(r, client, chart, parsed, '').endsWith('乙\n二')).toBe(true);
  });
});
