import { describe, expect, it } from 'vitest';
import { DECK, getCard, searchCards } from './deck';

describe('deck', () => {
  it('has 78 unique cards', () => {
    expect(DECK).toHaveLength(78);
    expect(new Set(DECK.map((c) => c.id)).size).toBe(78);
  });

  it('names majors and minors in Chinese', () => {
    expect(getCard('major-00').nameZh).toBe('愚人');
    expect(getCard('major-16').nameZh).toBe('塔');
    expect(getCard('swords-03').nameZh).toBe('宝剑三');
    expect(getCard('wands-01').nameZh).toBe('权杖王牌');
    expect(getCard('pentacles-12').nameZh).toBe('星币骑士');
    expect(getCard('cups-13').nameZh).toBe('圣杯王后');
    expect(getCard('pentacles-12').commonsFile).toBe('Pents12.jpg');
  });

  it('throws on unknown id', () => {
    expect(() => getCard('nope')).toThrow();
  });

  it('searches by Chinese name, digits and English', () => {
    expect(searchCards('塔').map((c) => c.id)).toContain('major-16');
    expect(searchCards('宝剑三').map((c) => c.id)).toEqual(['swords-03']);
    expect(searchCards('宝剑3').map((c) => c.id)).toEqual(['swords-03']);
    expect(searchCards('权杖一').map((c) => c.id)).toEqual(['wands-01']);
    expect(searchCards('knight')).toHaveLength(4);
    expect(searchCards(' 星 星 ').map((c) => c.id)).toContain('major-17');
  });

  it('returns whole deck for empty query', () => {
    expect(searchCards('  ')).toHaveLength(78);
  });
});
