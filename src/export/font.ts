const BASICS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.·|｜/：:，。、—「」（）';

export function fontSubsetChars(text: string): string {
  return [...new Set([...text.replace(/\s/g, ''), ...BASICS])].join('');
}

export function fontCssUrl(chars: string): string {
  return `https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600&text=${encodeURIComponent(chars)}`;
}

async function fetchOk(url: string): Promise<Response> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// 只取长图里实际出现的字，Google Fonts 返回一个很小的子集字体；断网时调用方退回系统字体。
export async function buildFontEmbedCss(text: string): Promise<string> {
  let css = await (await fetchOk(fontCssUrl(fontSubsetChars(text)))).text();
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
  for (const url of urls) {
    const dataUrl = await blobToDataUrl(await (await fetchOk(url)).blob());
    css = css.split(url).join(dataUrl);
  }
  return css;
}
