import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#141a2b"/>
  <path d="M256 96 C272 200 312 240 416 256 C312 272 272 312 256 416 C240 312 200 272 96 256 C200 240 240 200 256 96 Z" fill="#c9a95c"/>
</svg>`;

await mkdir('public/icons', { recursive: true });
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}
console.log('icons done');
