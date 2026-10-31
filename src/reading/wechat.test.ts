import { describe, expect, it } from 'vitest';
import { newReading, type Reading } from './types';
import { cardTitle, toWechatText } from './wechat';

const r: Reading = {
  ...newReading(),
  question: ' 要继续合作吗？ ',
  positions: ['现状', '阻碍', '建议'],
  cards: [
    { id: 'pentacles-12', reversed: false },
    { id: 'swords-03', reversed: true },
    { id: 'major-17', reversed: false },
  ],
};

describe('toWechatText', () => {
  it('builds card titles', () => {
    expect(cardTitle(r, 1)).toBe('第二张 · 阻碍 · 宝剑三 逆位');
  });

  it('formats sections', () => {
    const text = toWechatText(r, { kind: 'sections', cards: ['A', 'B', 'C'], overall: 'D', advice: 'E' });
    expect(text).toBe(
      [
        '问题：要继续合作吗？',
        '',
        '第一张 · 现状 · 星币骑士 正位',
        'A',
        '——',
        '第二张 · 阻碍 · 宝剑三 逆位',
        'B',
        '——',
        '第三张 · 建议 · 星星 正位',
        'C',
        '——',
        '整体解读',
        'D',
        '——',
        '建议',
        'E',
        '',
        '小艾',
      ].join('\n'),
    );
  });

  it('includes the chart section when present', () => {
    const text = toWechatText(r, { kind: 'sections', cards: ['A', 'B', 'C'], chart: 'M', overall: 'D', advice: 'E' });
    expect(text).toContain('C\n——\n命盘参考\nM\n——\n整体解读');
  });

  it('formats plain text', () => {
    expect(toWechatText(r, { kind: 'plain', text: '整段' })).toBe('问题：要继续合作吗？\n\n整段\n\n小艾');
  });
});
