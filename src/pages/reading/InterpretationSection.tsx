import { useState } from 'react';
import { TextModal } from '../../components/TextModal';
import { copyText } from '../../lib/clipboard';
import { buildPrompt } from '../../prompt/template';
import { isReadyForPrompt, type Reading } from '../../reading/types';

export function InterpretationSection({ reading: r, onChange }: { reading: Reading; onChange: (patch: Partial<Reading>) => void }) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const ready = isReadyForPrompt(r);

  const copy = async () => {
    const text = buildPrompt(r);
    if (await copyText(text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      setFallback(text);
    }
  };

  return (
    <section className="section">
      <h2>解读</h2>
      <button type="button" className="primary" disabled={!ready} onClick={copy}>{copied ? '已复制' : '复制提示词'}</button>
      {!ready && <p className="hint">填好问题、三个位置和三张牌后可复制</p>}
      <textarea className="interp" rows={14} placeholder="粘贴 Claude 生成的解读，可直接修改" value={r.interpretation} onChange={(e) => onChange({ interpretation: e.target.value })} />
      {fallback !== null && <TextModal title="复制失败，请手动全选复制" text={fallback} onClose={() => setFallback(null)} />}
    </section>
  );
}
