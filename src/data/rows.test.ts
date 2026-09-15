import { describe, expect, it } from 'vitest';
import { newReading, type Reading } from '../reading/types';
import { fromRow, toRow } from './rows';

describe('rows', () => {
  it('round-trips a reading', () => {
    const r: Reading = { ...newReading(), clientName: '小林', cards: [{ id: 'major-00', reversed: true }, null, null], exportTheme: 'night' };
    expect(fromRow(toRow(r))).toEqual(r);
  });

  it('pads short positions/cards and normalises unknown preset', () => {
    const r = fromRow({
      id: 'x', created_at: '2026-09-15T00:00:00+00:00', updated_at: '2026-09-15T00:00:00+00:00',
      client_name: '', question: '', spread_preset: 'weird', positions: ['A'], cards: [], interpretation: '', export_theme: null,
    });
    expect(r.positions).toEqual(['A', '', '']);
    expect(r.cards).toEqual([null, null, null]);
    expect(r.spreadPreset).toBe('custom');
    expect(r.createdAt).toBe('2026-09-15T00:00:00.000Z');
  });
});
