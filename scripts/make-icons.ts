import { execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import sharp from 'sharp';

// 牌背式图标：深夜蓝底、烫金双线牌框、中间一颗细长八芒星和一弯新月。
// full = PWA/iOS 用，满版无透明边（系统自己切圆角）；mac = 桌面 .app 用，带 macOS 标准留白和圆角。
function iconSvg(mode: 'full' | 'mac'): string {
  const plate =
    mode === 'full'
      ? `<rect width="1024" height="1024" fill="url(#bg)"/>`
      : `<rect x="100" y="100" width="824" height="824" rx="185" fill="url(#bg)"/>
         <rect x="100.5" y="100.5" width="823" height="823" rx="184.5" fill="none" stroke="#2e3650" stroke-width="1"/>`;
  const s = mode === 'full' ? 1 : 0.86;
  const t = (1 - s) * 512;

  // 细长主芒：侧边是内凹曲线，末端收成针尖。
  const ray = (len: number, w: number) => `M0 ${-len} C${w * 0.18} ${-len * 0.45} ${w * 0.55} ${-w * 0.9} ${w} 0 C${w * 0.55} ${w * 0.9} ${w * 0.18} ${len * 0.45} 0 ${len} C${-w * 0.18} ${len * 0.45} ${-w * 0.55} ${w * 0.9} ${-w} 0 C${-w * 0.55} ${-w * 0.9} ${-w * 0.18} ${-len * 0.45} 0 ${-len} Z`;
  const dust = [
    [360, 300, 5], [668, 350, 4], [338, 640, 3.5], [690, 690, 5], [612, 262, 3],
  ]
    .map(([x, y, r]) => `<path d="${ray(r * 3.2, r)}" transform="translate(${x} ${y})" fill="#e8d5a3" opacity="0.8"/>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="70%">
      <stop offset="0" stop-color="#222c4a"/>
      <stop offset="0.6" stop-color="#161d31"/>
      <stop offset="1" stop-color="#0f1424"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f0dca6"/>
      <stop offset="0.45" stop-color="#c9a95c"/>
      <stop offset="0.75" stop-color="#e2c784"/>
      <stop offset="1" stop-color="#a8843f"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#d9b56a" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#d9b56a" stop-opacity="0"/>
    </radialGradient>
    <mask id="crescent" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
      <rect width="1024" height="1024" fill="#fff"/>
      <circle cx="525" cy="279" r="27" fill="#000"/>
    </mask>
  </defs>
  ${plate}
  <g transform="translate(${t} ${t}) scale(${s})">
    <rect x="292" y="176" width="440" height="672" rx="26" fill="#161d33" stroke="url(#gold)" stroke-width="7"/>
    <rect x="316" y="200" width="392" height="624" rx="14" fill="none" stroke="url(#gold)" stroke-width="2"/>
    <circle cx="512" cy="512" r="170" fill="url(#halo)"/>
    <circle cx="512" cy="512" r="118" fill="none" stroke="url(#gold)" stroke-width="1.6" opacity="0.7"/>
    <g transform="translate(512 512)">
      <path d="${ray(92, 14)}" transform="rotate(45)" fill="url(#gold)" opacity="0.85"/>
      <path d="${ray(92, 14)}" transform="rotate(-45)" fill="url(#gold)" opacity="0.85"/>
      <path d="${ray(168, 26)}" fill="url(#gold)"/>
      <path d="${ray(168, 26)}" transform="rotate(90)" fill="url(#gold)"/>
      <circle r="9" fill="#fbf1d2"/>
    </g>
    <g transform="rotate(-30 512 286)"><circle cx="512" cy="286" r="30" fill="#d8bb74" mask="url(#crescent)"/></g>
    <path d="M420 772 H490 M534 772 H604" stroke="#c9a95c" stroke-width="2"/>
    <path d="M512 758 l10 14 -10 14 -10 -14 Z" fill="url(#gold)"/>
    ${dust}
  </g>
</svg>`;
}

await mkdir('public/icons', { recursive: true });
const full = Buffer.from(iconSvg('full'));
for (const size of [192, 512]) {
  await sharp(full).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}
await sharp(full).resize(1024, 1024).png().toFile('public/icons/icon-1024.png');

// macOS .icns，给桌面启动器用。
const mac = Buffer.from(iconSvg('mac'));
const set = 'build/AppIcon.iconset';
await rm(set, { recursive: true, force: true });
await mkdir(set, { recursive: true });
for (const size of [16, 32, 128, 256, 512]) {
  await sharp(mac).resize(size, size).png().toFile(`${set}/icon_${size}x${size}.png`);
  await sharp(mac).resize(size * 2, size * 2).png().toFile(`${set}/icon_${size}x${size}@2x.png`);
}
await sharp(mac).resize(1024, 1024).png().toFile('build/icon-mac-1024.png');
if (process.platform === 'darwin') execFileSync('iconutil', ['-c', 'icns', set, '-o', 'build/AppIcon.icns']);
console.log('icons done');
