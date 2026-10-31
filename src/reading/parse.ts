export type ParsedInterpretation = { kind: 'sections'; sections: { title: string; body: string }[] } | { kind: 'plain'; text: string };

// 比较标题时忽略空格和全角半角冒号，AI 常把「：」写成「:」。
const norm = (s: string) => s.replace(/[\s:：]/g, '');

const HEADING = /^[\s*#>]*[【[]\s*([^【】[\]]+?)\s*[】\]][\s*]*$/;

// 按【标题】独占行拆段。要求的标题必须全部出现且有正文，否则整段排版；拆分失败从不阻止导出。
export function parseInterpretation(raw: string, titles: string[]): ParsedInterpretation {
  const text = raw.replace(/\r\n?/g, '\n').trim();
  const bodies = new Map<string, string[]>();
  let current: string | null = null;

  for (const line of text.split('\n')) {
    const m = line.match(HEADING);
    if (m) {
      const label = norm(m[1]);
      const title = titles.find((t) => label.startsWith(norm(t)));
      if (title && !bodies.has(title)) {
        bodies.set(title, []);
        current = title;
        continue;
      }
    }
    if (current !== null) bodies.get(current)!.push(line);
  }

  const sections = titles.map((title) => ({ title, body: (bodies.get(title) ?? []).join('\n').replace(/\n{3,}/g, '\n\n').trim() }));
  if (sections.every((s) => s.body)) return { kind: 'sections', sections };
  return { kind: 'plain', text };
}
