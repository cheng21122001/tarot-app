import { cardDisplayName, ORDINALS } from './labels';
import type { ParsedInterpretation } from './parse';
import type { Reading } from './types';

export const SIGNATURE = '小艾';

export function cardTitle(r: Reading, i: 0 | 1 | 2): string {
  return `${ORDINALS[i]} · ${r.positions[i]} · ${cardDisplayName(r.cards[i])}`;
}

export function toWechatText(r: Reading, parsed: ParsedInterpretation): string {
  const head = `问题：${r.question.trim()}`;
  if (parsed.kind === 'plain') return [head, '', parsed.text, '', SIGNATURE].join('\n');
  const blocks = ([0, 1, 2] as const).map((i) => `${cardTitle(r, i)}\n${parsed.cards[i]}`);
  blocks.push(`整体解读\n${parsed.overall}`, `建议\n${parsed.advice}`);
  return [head, '', blocks.join('\n——\n'), '', SIGNATURE].join('\n');
}
