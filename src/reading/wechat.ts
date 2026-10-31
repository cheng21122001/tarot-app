import { pillarsText, type BaziChart } from '../bazi/chart';
import { readingTitle, type Client, type Reading } from '../domain/types';
import type { ParsedInterpretation } from './parse';

export function toWechatText(r: Reading, client: Client, c: BaziChart, parsed: ParsedInterpretation, signature: string): string {
  const head = [`${client.name.trim() || '命主'} · ${readingTitle(r)}`, `八字：${pillarsText(c)}（日主${c.dayMaster}）`];
  const body = parsed.kind === 'plain' ? parsed.text : parsed.sections.map((s) => `${s.title}\n${s.body}`).join('\n——\n');
  return [...head, '', body, ...(signature.trim() ? ['', signature.trim()] : [])].join('\n');
}
