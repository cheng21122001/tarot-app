import { useCallback, useMemo, useState } from 'react';
import { buildChart } from '../bazi/chart';
import { ChartView } from '../components/ChartView';
import { Gz } from '../components/Gz';
import { PageBar } from '../components/PageBar';
import { TextModal } from '../components/TextModal';
import { readingTitle, SCHOOL_HINTS, SCHOOL_LABELS, SCHOOLS, type Client, type Reading, type School } from '../domain/types';
import { ExportModal } from '../export/ExportModal';
import { LongImage } from '../export/LongImage';
import { copyText, readText } from '../lib/clipboard';
import { useAutosave } from '../lib/useAutosave';
import { useSystemTheme } from '../lib/useSystemTheme';
import { buildPrompt } from '../prompt/template';
import { formatDate } from '../reading/format';
import { parseInterpretation } from '../reading/parse';
import { sectionsFor } from '../reading/sections';
import { toWechatText } from '../reading/wechat';

const never = () => false;

export function ReadingPage(props: { initial: Reading; client: Client | null; onSave: (r: Reading) => void; onDelete: () => void; onHome: () => void; onOpenClient: () => void }) {
  const { value: r, change, discard, saveNow, status } = useAutosave(props.initial, props.onSave, never);
  const client = props.client;
  const name = client?.name.trim() || r.clientName || '客人';
  const chart = client ? buildChart(client.birth, r.year) : null;
  const titles = useMemo(() => sectionsFor(r.kind, r.schools), [r.kind, r.schools]);
  const parsed = useMemo(() => parseInterpretation(r.interpretation, titles), [r.interpretation, titles]);
  const systemTheme = useSystemTheme();
  const theme = r.exportTheme ?? systemTheme;
  const hasText = Boolean(r.interpretation.trim());
  const flat = r.interpretation.replace(/[\s:：]/g, '');
  const found = titles.filter((t) => flat.includes(`【${t.replace(/[\s:：]/g, '')}`)).length;
  // 至少保留一派；旧测算（没有流派）第一次勾选时直接切换到新写法。
  const toggleSchool = (s: School) => {
    const on = r.schools.includes(s);
    if (on && r.schools.length === 1) return;
    change({ schools: on ? r.schools.filter((x) => x !== s) : SCHOOLS.filter((x) => x === s || r.schools.includes(x)) });
  };

  const [flash, setFlash] = useState('');
  const [fallback, setFallback] = useState<{ title: string; text: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const say = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(''), 2200);
  };
  const copy = async (text: string, done: string) => {
    if (await copyText(text)) say(done);
    else setFallback({ title: '没能自动复制，请手动全选复制', text });
  };

  const paste = async () => {
    const text = (await readText())?.trim();
    if (!text) return say('剪贴板是空的，或浏览器不让读，请长按解读框粘贴');
    if (hasText && !window.confirm('用剪贴板里的内容替换现在的解读？')) return;
    change({ interpretation: text }, true);
    say('已粘贴并保存');
  };

  const remove = useCallback(() => {
    if (!window.confirm('删除这条测算？手机和电脑上都会消失，不能恢复。')) return;
    discard();
    props.onDelete();
  }, [discard, props]);

  const ready = Boolean(chart && client);

  return (
    <div className="page">
      <PageBar crumbs={[{ label: '测算记录', onClick: props.onHome }, ...(client ? [{ label: name, onClick: props.onOpenClient }] : [])]} status={status} />
      <header className="reading-head">
        <h1>{readingTitle(r)}</h1>
        <p>
          {client ? <button type="button" className="link" onClick={props.onOpenClient}>{name}</button> : name}
          <span>{formatDate(r.createdAt)} 建</span>
        </p>
      </header>

      <ol className="steps">
        <li>
          <h2>用哪几派看</h2>
          <div className="schools">
            {SCHOOLS.map((s) => (
              <button type="button" key={s} className={r.schools.includes(s) ? 'on' : ''} aria-pressed={r.schools.includes(s)} onClick={() => toggleSchool(s)}>
                <strong>{SCHOOL_LABELS[s]}</strong>
                <span>{SCHOOL_HINTS[s]}</span>
              </button>
            ))}
          </div>
          <p className="hint">
            {r.schools.length === 0
              ? '这条是加流派之前建的，按旧写法分段。勾选流派后要重新复制提示词问 Claude。'
              : r.schools.length > 1
                ? '各派分开写，最后对照哪里一致、哪里相反。'
                : '只用一派看，不写对照。'}
          </p>
          <h2 className="sub">客人想重点看什么</h2>
          {r.kind === 'year' && (
            <label className="field inline-field">
              <span>看哪一年</span>
              <input inputMode="numeric" value={r.year} onChange={(e) => change({ year: Number(e.target.value.replace(/\D/g, '').slice(0, 4)) || new Date().getFullYear() })} />
            </label>
          )}
          <textarea rows={2} placeholder="可以不填。比如：明年适合换工作吗" value={r.focus} onChange={(e) => change({ focus: e.target.value })} />
        </li>

        <li>
          <h2>核对排盘</h2>
          {chart ? (
            <details className="chart-toggle">
              <summary>
                <span className="summary-gz">{chart.pillars.map((p) => <Gz key={p.label} text={p.gan + p.zhi} />)}</span>
                <span className="summary-more">{r.kind === 'year' ? `${r.year} 流年 ${chart.liuNian.ganZhi}，展开看流月` : '展开看完整命盘'}</span>
              </summary>
              <ChartView chart={chart} showYear={r.kind === 'year'} />
            </details>
          ) : (
            <p className="error">
              {client ? '客人的出生信息不完整，排不了盘。' : '找不到这位客人的档案，排不了盘。'}
              {client && <button type="button" className="link" onClick={props.onOpenClient}>去补全</button>}
            </p>
          )}
        </li>

        <li>
          <h2>请 Claude 写解读</h2>
          <p className="hint">点下方「复制提示词」，到 Claude 里粘贴发送；写好后复制它的回复，回来点「粘贴解读」。可以直接在框里修改。</p>
          <textarea className="interp" rows={14} placeholder="解读会出现在这里" value={r.interpretation} onChange={(e) => change({ interpretation: e.target.value })} />
          {hasText && (
            <p className={parsed.kind === 'sections' ? 'hint ok' : 'hint'}>
              {parsed.kind === 'sections' ? `已识别全部 ${titles.length} 段，导出会按段排版。` : `识别到 ${found}/${titles.length} 段标题，缺的话导出时按整篇排版。应有：${titles.join('、')}。`}
            </p>
          )}
        </li>

        <li>
          <h2>发给客人</h2>
          <div className="export-row">
            <div className="seg">
              <button type="button" className={theme === 'day' ? 'on' : ''} onClick={() => change({ exportTheme: 'day' })}>浅色长图</button>
              <button type="button" className={theme === 'night' ? 'on' : ''} onClick={() => change({ exportTheme: 'night' })}>深色长图</button>
            </div>
          </div>
          <div className="export-row">
            <button type="button" className={`btn${hasText ? ' go' : ''}`} disabled={!hasText || !chart} onClick={() => setPreview(true)}>生成长图</button>
            <button type="button" className="btn" disabled={!hasText || !ready} onClick={() => chart && client && copy(toWechatText(r, client, chart, parsed), '微信文字已复制')}>复制微信文字</button>
          </div>
          {!hasText && <p className="hint">有了解读才能导出。</p>}
        </li>
      </ol>

      <button type="button" className="link danger" onClick={remove}>删除这条测算</button>

      <div className="action-bar">
        {flash && <div className="toast" role="status">{flash}</div>}
        <button type="button" className={`btn${!hasText ? ' go' : ''}`} disabled={!ready} onClick={() => chart && client && copy(buildPrompt(r, client, chart), '提示词已复制，去 Claude 粘贴')}>复制提示词</button>
        <button type="button" className="btn" onClick={paste}>粘贴解读</button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            saveNow();
            say('已保存');
          }}
        >
          保存
        </button>
      </div>

      {preview && chart && (
        <ExportModal fileName={`八字-${name}-${readingTitle(r)}-${formatDate(r.createdAt)}.png`} onClose={() => setPreview(false)}>
          <LongImage reading={r} name={name} chart={chart} parsed={parsed} theme={theme} />
        </ExportModal>
      )}
      {fallback && <TextModal title={fallback.title} text={fallback.text} onClose={() => setFallback(null)} />}
    </div>
  );
}
