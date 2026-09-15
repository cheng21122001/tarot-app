import { toBlob } from 'html-to-image';
import { buildFontEmbedCss } from './font';

export async function renderLongImage(node: HTMLElement): Promise<Blob> {
  let fontEmbedCSS = '';
  try {
    fontEmbedCSS = await buildFontEmbedCss(node.textContent ?? '');
  } catch (e) {
    console.warn('font subset unavailable, using system font', e);
  }
  const blob = await toBlob(node, {
    pixelRatio: 1,
    cacheBust: false,
    ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
  });
  if (!blob) throw new Error('toBlob returned null');
  return blob;
}
