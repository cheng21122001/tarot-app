import { describe, expect, it } from 'vitest';
import { newClient, newReading, newSettings, type Client } from '../domain/types';
import { fromRow, toRow, type Row } from './rows';

const client: Client = { ...newClient(), name: '小林', note: '做设计', birth: { calendar: 'lunar', date: '1998-05-03', leapMonth: true, time: null, gender: 'male' } };

describe('rows', () => {
  it('round-trips a client', () => {
    expect(fromRow(toRow(client))).toEqual(client);
  });

  it('round-trips a reading', () => {
    const r = { ...newReading(client, 'year', 2027), focus: '换工作', interpretation: '正文', exportTheme: 'night' as const };
    const row = toRow(r);
    expect(row.spread_preset).toBe('bazi_year');
    expect(fromRow(row)).toEqual(r);
  });

  it('round-trips a vedic reading and a birth place', () => {
    const withPlace: Client = { ...client, birth: { ...client.birth, place: { name: '成都', lat: 30.57, lon: 104.07, tz: 'Asia/Shanghai' } } };
    expect(fromRow(toRow(withPlace))).toEqual(withPlace);
    const r = { ...newReading(withPlace, 'natal', 2026, new Date(), 'vedic'), interpretation: '正文' };
    const row = toRow(r);
    expect(row.spread_preset).toBe('vedic_natal');
    expect(fromRow(row)).toEqual(r);
    expect(toRow(newReading(withPlace, 'year', 2027, new Date(), 'vedic')).spread_preset).toBe('vedic_year');
  });

  it('reads readings saved before vedic as bazi', () => {
    const r = newReading(client, 'natal', 2026);
    expect((fromRow(toRow(r)) as { system: string }).system).toBe('bazi');
  });

  it('skips old tarot rows and deleted rows', () => {
    const tarot: Row = {
      id: 'x', created_at: '2026-09-15T00:00:00+00:00', updated_at: '2026-09-15T00:00:00+00:00', client_name: 'a', question: 'q',
      spread_preset: 'past_present_future', positions: ['过去', '现在', '未来'], cards: [{ id: 'major-00', reversed: false }, null, null], interpretation: '', export_theme: null,
    };
    expect(fromRow(tarot)).toBeNull();
    expect(fromRow({ ...tarot, spread_preset: 'deleted', cards: [null, null, null] })).toBeNull();
  });
});

describe('settings row', () => {
  it('round-trips the signature', () => {
    const s = { ...newSettings(), signature: '小艾' };
    expect(fromRow(toRow(s))).toEqual(s);
  });
});
