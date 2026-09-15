import { describe, expect, it } from 'vitest';
import { isBlank, isComplete, isReadyForPrompt, newReading, PRESETS, type Reading } from './types';

describe('reading helpers', () => {
  it('creates a blank reading with default preset', () => {
    const r = newReading(new Date('2026-09-15T10:00:00Z'));
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(r.createdAt).toBe('2026-09-15T10:00:00.000Z');
    expect(r.updatedAt).toBe(r.createdAt);
    expect(r.spreadPreset).toBe('past_present_future');
    expect(r.positions).toEqual(PRESETS.past_present_future);
    expect(r.cards).toEqual([null, null, null]);
    expect(r.exportTheme).toBeNull();
    expect(isBlank(r)).toBe(true);
    expect(isComplete(r)).toBe(false);
  });

  it('is not blank once anything is filled', () => {
    expect(isBlank({ ...newReading(), clientName: '小林' })).toBe(false);
    expect(isBlank({ ...newReading(), cards: [{ id: 'major-00', reversed: false }, null, null] })).toBe(false);
  });

  it('is ready for prompt only with question, positions and three cards', () => {
    const r: Reading = {
      ...newReading(),
      question: '要继续合作吗？',
      cards: [
        { id: 'pentacles-12', reversed: false },
        { id: 'swords-03', reversed: true },
        { id: 'major-17', reversed: false },
      ],
    };
    expect(isReadyForPrompt(r)).toBe(true);
    expect(isReadyForPrompt({ ...r, question: '  ' })).toBe(false);
    expect(isReadyForPrompt({ ...r, positions: ['现状', '', '建议'] })).toBe(false);
    expect(isReadyForPrompt({ ...r, cards: [r.cards[0], null, r.cards[2]] })).toBe(false);
  });

  it('is complete when interpretation has text', () => {
    expect(isComplete({ ...newReading(), interpretation: ' \n ' })).toBe(false);
    expect(isComplete({ ...newReading(), interpretation: '解读' })).toBe(true);
  });
});
