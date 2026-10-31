import { describe, expect, it } from 'vitest';
import { parseInterpretation } from './parse';

const standard = `【第一张｜现状｜星币骑士·正位】
现状段落。

【第二张｜阻碍｜宝剑三·逆位】
阻碍段落第一句。
阻碍段落第二句。
【第三张｜建议｜星星·正位】
建议牌段落。
【整体解读】
整体段落。
【建议】
行动建议。`;

describe('parseInterpretation', () => {
  it('splits the standard format', () => {
    expect(parseInterpretation(standard)).toEqual({
      kind: 'sections',
      cards: ['现状段落。', '阻碍段落第一句。\n阻碍段落第二句。', '建议牌段落。'],
      overall: '整体段落。',
      advice: '行动建议。',
    });
  });

  it('ignores a preamble before the first heading', () => {
    const r = parseInterpretation(`好的，以下是解读：\n\n${standard}`);
    expect(r.kind).toBe('sections');
  });

  it('collapses runs of blank lines inside a section', () => {
    const r = parseInterpretation(standard.replace('整体段落。', '第一段。\n\n\n\n第二段。'));
    expect(r.kind === 'sections' && r.overall).toBe('第一段。\n\n第二段。');
  });

  it('accepts half-width brackets, markdown decoration and CRLF', () => {
    const messy = standard
      .replace('【整体解读】', '**【整体解读】**')
      .replace('【建议】', '## [建议]')
      .replace('【第一张｜现状｜星币骑士·正位】', '[第一张 | 现状 | 星币骑士·正位]')
      .replace(/\n/g, '\r\n');
    const r = parseInterpretation(messy);
    expect(r.kind).toBe('sections');
    expect(r.kind === 'sections' && r.advice).toBe('行动建议。');
  });

  it('still splits when the card name in a heading does not match', () => {
    const r = parseInterpretation(standard.replace('宝剑三·逆位', '宝剑四·正位'));
    expect(r.kind).toBe('sections');
  });

  it('falls back to plain when a section is missing', () => {
    const noAdvice = standard.replace('【建议】\n行动建议。', '');
    expect(parseInterpretation(noAdvice)).toEqual({ kind: 'plain', text: noAdvice.trim() });
  });

  it('falls back to plain when a section is empty', () => {
    const empty = standard.replace('整体段落。', '');
    expect(parseInterpretation(empty).kind).toBe('plain');
  });

  it('falls back to plain when there are no headings', () => {
    expect(parseInterpretation('  一整段解读。\n第二行。 ')).toEqual({ kind: 'plain', text: '一整段解读。\n第二行。' });
  });

  it('returns empty plain for empty input', () => {
    expect(parseInterpretation('')).toEqual({ kind: 'plain', text: '' });
  });
});

describe('parseInterpretation with 命盘参考', () => {
  it('picks up the optional chart section', () => {
    const text = standard.replace('【整体解读】', '【命盘参考】\n命盘段落。\n【整体解读】');
    const r = parseInterpretation(text);
    expect(r.kind === 'sections' && r.chart).toBe('命盘段落。');
    expect(r.kind === 'sections' && r.overall).toBe('整体段落。');
  });
});
