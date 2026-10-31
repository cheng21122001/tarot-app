import { describe, expect, it } from 'vitest';
import { newReading, type Reading } from '../reading/types';
import { fromRow, toRow } from './rows';

describe('rows', () => {
  it('round-trips a reading', () => {
    const r: Reading = { ...newReading(), clientName: '小林', cards: [{ id: 'major-00', reversed: true }, null, null], exportTheme: 'night', birth: { calendar: 'lunar', date: '1998-05-03', leapMonth: true, time: null, gender: 'female' } };
    expect(fromRow(toRow(r))).toEqual(r);
  });

  it('stores birth info as a fourth cards entry that old readers ignore', () => {
    const r: Reading = { ...newReading(), cards: [{ id: 'major-00', reversed: false }, null, null], birth: { calendar: 'solar', date: '1998-03-12', leapMonth: false, time: '14:30', gender: 'female' } };
    const row = toRow(r);
    expect(row.cards).toHaveLength(4);
    expect(row.cards.slice(0, 3)).toEqual(r.cards);
    expect(fromRow(row).birth).toEqual(r.birth);
    expect(toRow({ ...r, birth: null }).cards).toHaveLength(3);
  });

  it('pads short positions/cards and normalises unknown preset', () => {
    const r = fromRow({
      id: 'x', created_at: '2026-09-15T00:00:00+00:00', updated_at: '2026-09-15T00:00:00+00:00',
      client_name: '', question: '', spread_preset: 'weird', positions: ['A'], cards: [], interpretation: '', export_theme: null,
    });
    expect(r.positions).toEqual(['A', '', '']);
    expect(r.cards).toEqual([null, null, null]);
    expect(r.spreadPreset).toBe('custom');
    expect(r.birth).toBeNull();
    expect(r.createdAt).toBe('2026-09-15T00:00:00.000Z');
  });
});
