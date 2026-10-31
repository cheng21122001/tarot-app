import { useCallback, useMemo, useState } from 'react';
import { buildChart } from '../bazi/chart';
import { ChartView } from '../components/ChartView';
import { TextModal } from '../components/TextModal';
import { readingTitle, type Client, type Reading } from '../domain/types';
import { ExportModal } from '../export/ExportModal';
import { LongImage } from '../export/LongImage';
import { copyText, readText } from '../lib/clipboard';
import { useAutosave } from '../lib/useAutosave';
import { useSystemTheme } from '../lib/useSystemTheme';
import { buildPrompt } from '../prompt/template';
import { formatDate } from '../reading/format';
import { parseInterpretation } from '../reading/parse';
import { SECTIONS } from '../reading/sections';
import { toWechatText } from '../reading/wechat';

const never = () => false;

export function ReadingPage(props: { initial: Reading; client: Client | null; onSave: (r: Reading) => void; onDelete: () => void; onBack: () => void; onOpenClient: () => void }) {
  const { value: r, change, discard } = useAutosave(props.initial, props.onSave, never);
  const client = props.client;
  const chart = client ? buildChart(client.birth, r.year) : null;
  const parsed = useMemo(() => parseInterpretation(r.interpretation, SECTIONS[r.kind]), [r.interpretation, r.kind]);
  const systemTheme = useSystemTheme();
  const theme = r.exportTheme ?? systemTheme;
  const hasText = Boolean(r.interpretation.trim());

  const [flash, setFlash] = useState('');
  const [fallback, setFallback] = useState<{ title: string; text: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const say = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(''), 2000);
  };
  const copy = async (text: string, done: string) => {
    if (await copyText(text)) say(done);
    else setFallback({ title: '复制失败，请手动全选复制', text });
  };

  const paste = async () => {
    const text = (await readText())?.trim();
    if (!text) return say('读不到剪贴板，请长按下方文本框粘贴');
    if (hasText && !window.confirm('用剪贴板内容替换现在的解读？')) return;
    change({ interpretation: text });
  };

  const remove = useCallback(() => {
    if (!window.confirm('删除这条测算？手机和电脑上都会消失，不能恢复。')) return;
    discard();
    props.onDelete();
  }, [discard, props]);

  const name = client?.name.trim() || r.clientName || '客人';

  return (
    <div className="page">
      <button type="button" className="text-btn back" onClick={props.onBack}>‹ 返回</button>
      <header className="reading-head">
        <h1>{readingTitle(r)}</h1>
        <p>
          {client ? <button type="button" className="text-btn inline" onClick={props.onOpenClient}>{name}</button> : name} · {formatDate(r.createdAt)}
        </p>
      </header>

      <section className="section">
        {r.kind === 'year' && (
          <label className="field">
            <span>看哪一年</span>
            <input inputMode="numeric" value={r.year} onChange={(e) => change({ year: Number(e.target.value.replace(/\D/g, '').slice(0, 4)) || new Date().getFullYear() })} />
          </label>
        )}
        <label className="field">
          <span>客人想重点看什么（可不填）</span>
          <textarea rows={2} placeholder="如：明年适合换工作吗、感情什么时候稳定" value={r.focus} onChange={(e) => change({ focus: e.target.value })} />
        </label>
        {chart ? (
          <details className="chart-toggle">
            <summary>排盘{r.kind === 'year' ? '与流月' : ''}</summary>
            <ChartView chart={chart} showYear={r.kind === 'year'} />
          </details>
        ) : (
          <p className="error">{client ? '客人出生信息不完整，' : '找不到这位客人的档案，'}无法排盘。{client && <button type="button" className="text-btn inline" onClick={props.onOpenClient}>去补全</button>}</p>
        )}
      </section>

      <section className="section">
        <h2>解读</h2>
        <div className="actions">
          <button type="button" className="primary" disabled={!chart || !client} onClick={() => chart && client && copy(buildPrompt(r, client, chart), '提示词已复制，去 Claude 粘贴')}>复制提示词</button>
          <button type="button" className="primary ghost" onClick={paste}>粘贴解读</button>
        </div>
        {flash && <p className="hint">{flash}</p>}
        <textarea className="interp" rows={16} placeholder="粘贴 Claude 生成的解读，可直接修改" value={r.interpretation} onChange={(e) => change({ interpretation: e.target.value })} />
        {hasText && parsed.kind === 'plain' && <p className="hint">没有识别出全部分段标题（{SECTIONS[r.kind].join('、')}），导出时按整段排版</p>}
      </section>

      <section className="section">
        <h2>导出</h2>
        <div className="field">
          <span>长图主题</span>
          <div className="chips">
            <button type="button" className={`chip${theme === 'day' ? ' on' : ''}`} onClick={() => change({ exportTheme: 'day' })}>白天</button>
            <button type="button" className={`chip${theme === 'night' ? ' on' : ''}`} onClick={() => change({ exportTheme: 'night' })}>夜间</button>
          </div>
        </div>
        <div className="actions">
          <button type="button" className="primary" disabled={!hasText || !chart} onClick={() => setPreview(true)}>生成长图</button>
          <button type="button" className="primary" disabled={!hasText || !chart || !client} onClick={() => chart && client && copy(toWechatText(r, client, chart, parsed), '已复制微信文字')}>复制微信文字</button>
        </div>
        {!hasText && <p className="hint">粘贴解读后可导出</p>}
      </section>

      <section className="section">
        <button type="button" className="text-btn danger" onClick={remove}>删除这条测算</button>
      </section>

      {preview && chart && (
        <ExportModal fileName={`八字-${name}-${readingTitle(r)}-${formatDate(r.createdAt)}.png`} onClose={() => setPreview(false)}>
          <LongImage reading={r} name={name} chart={chart} parsed={parsed} theme={theme} />
        </ExportModal>
      )}
      {fallback && <TextModal title={fallback.title} text={fallback.text} onClose={() => setFallback(null)} />}
    </div>
  );
}
