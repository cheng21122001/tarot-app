import { pillarsText, type BaziChart } from '../bazi/chart';
import { readingTitle, type Client, type Reading } from '../domain/types';
import type { ParsedInterpretation } from './parse';

export const SIGNATURE = '小艾';

export function toWechatText(r: Reading, client: Client, c: BaziChart, parsed: ParsedInterpretation): string {
  const head = [`${client.name.trim() || '客人'} · ${readingTitle(r)}`, `八字：${pillarsText(c)}（日主${c.dayMaster}）`];
  const body = parsed.kind === 'plain' ? parsed.text : parsed.sections.map((s) => `${s.title}\n${s.body}`).join('\n——\n');
  return [...head, '', body, '', SIGNATURE].join('\n');
}
