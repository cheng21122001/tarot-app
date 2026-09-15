import { access, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { DECK } from '../src/cards/deck';

const OUT = 'public/cards';
await mkdir(OUT, { recursive: true });

for (const card of DECK) {
  const out = `${OUT}/${card.id}.webp`;
  try {
    await access(out);
    continue;
  } catch {
    // not downloaded yet
  }
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(card.commonsFile)}?width=500`;
  const res = await fetch(url, { headers: { 'User-Agent': 'xiaoai-tarot/1.0 (personal, non-commercial)' } });
  if (!res.ok) throw new Error(`${card.id}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).resize({ width: 360 }).webp({ quality: 80 }).toFile(out);
  console.log('ok', card.id);
  await new Promise((r) => setTimeout(r, 300));
}
console.log('done');
