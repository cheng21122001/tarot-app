export type ParsedInterpretation =
  | { kind: 'sections'; cards: [string, string, string]; chart?: string; overall: string; advice: string }
  | { kind: 'plain'; text: string };

type Key = 0 | 1 | 2 | 'chart' | 'overall' | 'advice';

const HEADING = /^[\s*#>]*[【[]\s*([^【】[\]]+?)\s*[】\]][\s*]*$/;

function keyOf(label: string): Key | null {
  const s = label.replace(/\s/g, '');
  if (/^第(一|1)张/.test(s)) return 0;
  if (/^第(二|2)张/.test(s)) return 1;
  if (/^第(三|3)张/.test(s)) return 2;
  if (s.startsWith('命盘')) return 'chart';
  if (s.startsWith('整体解读')) return 'overall';
  if (s.startsWith('建议')) return 'advice';
  return null;
}

export function parseInterpretation(raw: string): ParsedInterpretation {
  const text = raw.replace(/\r\n?/g, '\n').trim();
  const bodies = new Map<Key, string[]>();
  let current: Key | null = null;

  for (const line of text.split('\n')) {
    const m = line.match(HEADING);
    if (m) {
      const key = keyOf(m[1]);
      if (key !== null && !bodies.has(key)) {
        bodies.set(key, []);
        current = key;
        continue;
      }
    }
    if (current !== null) bodies.get(current)!.push(line);
  }

  const body = (k: Key) => (bodies.get(k) ?? []).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const cards: [string, string, string] = [body(0), body(1), body(2)];
  const overall = body('overall');
  const advice = body('advice');

  const chart = body('chart');
  // 命盘参考段可有可无，其余五段必须齐全。
  if ([0, 1, 2, 'overall', 'advice'].every((k) => bodies.has(k as Key)) && [...cards, overall, advice].every(Boolean)) {
    return chart ? { kind: 'sections', cards, chart, overall, advice } : { kind: 'sections', cards, overall, advice };
  }
  return { kind: 'plain', text };
}
