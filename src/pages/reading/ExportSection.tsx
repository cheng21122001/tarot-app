import { useMemo, useState } from 'react';
import { TextModal } from '../../components/TextModal';
import { ExportModal } from '../../export/ExportModal';
import { copyText } from '../../lib/clipboard';
import { useSystemTheme } from '../../lib/useSystemTheme';
import { parseInterpretation } from '../../reading/parse';
import { isComplete, isReadyForPrompt, type Reading } from '../../reading/types';
import { toWechatText } from '../../reading/wechat';

export function ExportSection({ reading: r, onChange }: { reading: Reading; onChange: (patch: Partial<Reading>) => void }) {
  const systemTheme = useSystemTheme();
  const theme = r.exportTheme ?? systemTheme;
  const parsed = useMemo(() => parseInterpretation(r.interpretation), [r.interpretation]);
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);
  const ready = isReadyForPrompt(r) && isComplete(r);

  const copyWechat = async () => {
    const text = toWechatText(r, parsed);
    if (await copyText(text)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      setFallback(text);
    }
  };

  return (
    <section className="section">
      <h2>导出</h2>
      <div className="field">
        <span>长图主题</span>
        <div className="chips">
          <button type="button" className={`chip${theme === 'day' ? ' on' : ''}`} onClick={() => onChange({ exportTheme: 'day' })}>白天</button>
          <button type="button" className={`chip${theme === 'night' ? ' on' : ''}`} onClick={() => onChange({ exportTheme: 'night' })}>夜间</button>
        </div>
      </div>
      <div className="export-actions">
        <button type="button" className="primary" disabled={!ready} onClick={() => setPreview(true)}>生成长图</button>
        <button type="button" className="primary" disabled={!ready} onClick={copyWechat}>{copied ? '已复制' : '复制微信文字'}</button>
      </div>
      {!ready && <p className="hint">牌面填全、粘贴解读后可导出</p>}
      {parsed.kind === 'plain' && isComplete(r) && <p className="hint">解读没有识别出分段标题，将按整段排版</p>}
      {preview && <ExportModal reading={r} parsed={parsed} theme={theme} onClose={() => setPreview(false)} />}
      {fallback !== null && <TextModal title="复制失败，请手动全选复制" text={fallback} onClose={() => setFallback(null)} />}
    </section>
  );
}
