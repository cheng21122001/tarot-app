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

describe('buildPrompt with birth info', () => {
  const withBirth: Reading = {
    ...sample,
    createdAt: new Date(2026, 9, 31, 12).toISOString(),
    birth: { calendar: 'solar', date: '1998-03-12', leapMonth: false, time: '14:30', gender: 'female' },
  };

  it('adds the computed chart and a 命盘参考 heading', () => {
    const p = buildPrompt(withBirth);
    expect(p).toContain('四柱：戊寅 乙卯 戊午 己未');
    expect(p).toContain('日主：戊土');
    expect(p).toContain('流年：2026 丙午');
    expect(p).toContain('，女');
    expect(p).toContain('【第三张｜建议｜星星·正位】\n【命盘参考】\n【整体解读】\n【建议】');
    expect(p).toContain('六个标题');
  });

  it('notes an unknown hour', () => {
    expect(buildPrompt({ ...withBirth, birth: { ...withBirth.birth!, time: null } })).toContain('时辰不详');
  });

  it('leaves the plain prompt alone when birth is invalid', () => {
    const p = buildPrompt({ ...withBirth, birth: { ...withBirth.birth!, date: '1998-02-30' } });
    expect(p).not.toContain('命盘');
    expect(p).toContain('五个标题');
  });
});
