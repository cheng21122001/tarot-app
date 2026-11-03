import { pillarsText, type BaziChart } from '../bazi/chart';
import { readingTitle, type Client, type Reading } from '../domain/types';
import { NAKSHATRAS, PLANET_NAMES, SIGNS, type VedicChart } from '../vedic/chart';
import type { ParsedInterpretation } from './parse';

export function toWechatText(r: Reading, client: Client, c: BaziChart | VedicChart, parsed: ParsedInterpretation, signature: string): string {
  const line =
    'pillars' in c
      ? `八字：${pillarsText(c)}（日主${c.dayMaster}）`
      : `星盘：${c.lagna ? `${SIGNS[c.lagna.sign]}上升，` : ''}月亮${SIGNS[c.moon.sign]}，${NAKSHATRAS[c.moon.nak][1]}宿${c.currentMd ? `，${PLANET_NAMES[c.currentMd.lord]}大运` : ''}`;
  const head = [`${client.name.trim() || '命主'} · ${readingTitle(r)}`, line];
  const body = parsed.kind === 'plain' ? parsed.text : parsed.sections.map((s) => `${s.title}\n${s.body}`).join('\n——\n');
  return [...head, '', body, ...(signature.trim() ? ['', signature.trim()] : [])].join('\n');
}
