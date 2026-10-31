import { describe, expect, it } from 'vitest';
import { parseInterpretation } from './parse';

const titles = ['年度总览', '逐月提示', '建议'];
const standard = `【年度总览】
总览第一句。

总览第二段。
【逐月提示】
寅月（2/4 起）：留意合同。
【建议】
多休息。`;

describe('parseInterpretation', () => {
  it('splits the standard format', () => {
    expect(parseInterpretation(standard, titles)).toEqual({
      kind: 'sections',
      sections: [
        { title: '年度总览', body: '总览第一句。\n\n总览第二段。' },
        { title: '逐月提示', body: '寅月（2/4 起）：留意合同。' },
        { title: '建议', body: '多休息。' },
      ],
    });
  });

  it('tolerates a preamble, markdown marks, half-width brackets and spaces', () => {
    const r = parseInterpretation(`好的，以下是解读：\n\n## 【年度 总览】\n总览。\n[逐月提示]\n逐月。\n**【建议】**\n建议。`, titles);
    expect(r.kind).toBe('sections');
  });

  it('falls back to plain text when a section is missing or empty', () => {
    expect(parseInterpretation('【年度总览】\n总览。\n【建议】\n建议。', titles).kind).toBe('plain');
    expect(parseInterpretation('【年度总览】\n总览。\n【逐月提示】\n【建议】\n建议。', titles).kind).toBe('plain');
    expect(parseInterpretation('没有标题的一整段。', titles)).toEqual({ kind: 'plain', text: '没有标题的一整段。' });
  });

  it('does not treat a body line in brackets as a new section', () => {
    const r = parseInterpretation(standard.replace('多休息。', '多休息。\n【注意】\n少熬夜。'), titles);
    expect(r.kind === 'sections' && r.sections[2].body).toBe('多休息。\n【注意】\n少熬夜。');
  });
});
