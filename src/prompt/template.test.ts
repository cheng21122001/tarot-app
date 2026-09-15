import { describe, expect, it } from 'vitest';
import { newReading, type Reading } from '../reading/types';
import { buildPrompt } from './template';

const sample: Reading = {
  ...newReading(),
  clientName: '小林',
  question: '我和现在的合作方，还要继续合作吗？',
  spreadPreset: 'situation_obstacle_advice',
  positions: ['现状', '阻碍', '建议'],
  cards: [
    { id: 'pentacles-12', reversed: false },
    { id: 'swords-03', reversed: true },
    { id: 'major-17', reversed: false },
  ],
};

describe('buildPrompt', () => {
  it('includes the materials', () => {
    const p = buildPrompt(sample);
    expect(p).toContain('客人称呼：小林');
    expect(p).toContain('问题：我和现在的合作方，还要继续合作吗？');
    expect(p).toContain('第二张（阻碍）：宝剑三·逆位');
  });

  it('spells out the exact output headings', () => {
    const p = buildPrompt(sample);
    expect(p).toContain('【第一张｜现状｜星币骑士·正位】\n【第二张｜阻碍｜宝剑三·逆位】\n【第三张｜建议｜星星·正位】\n【整体解读】\n【建议】');
  });

  it('carries the writing rules', () => {
    const p = buildPrompt(sample);
    expect(p).toContain('600 到 900 字');
    expect(p).toContain('韦特');
    expect(p).toContain('不要在正文里写免责声明');
  });

  it('falls back to 客人 when name is empty', () => {
    expect(buildPrompt({ ...sample, clientName: ' ' })).toContain('客人称呼：客人');
  });
});
