import { useCallback, useMemo, useState } from 'react';
import { buildChart } from '../bazi/chart';
import { BirthEditor } from '../components/BirthEditor';
import { ChartView } from '../components/ChartView';
import { PageBar } from '../components/PageBar';
import { VedicView } from '../components/VedicView';
import { isClientBlank, readingTitle, SYSTEM_LABELS, type Client, type Reading, type System } from '../domain/types';
import { useAutosave } from '../lib/useAutosave';
import { formatDate } from '../reading/format';
import { buildVedicChart } from '../vedic/chart';
import { NewReadingButtons } from './NewReading';

export function ClientPage(props: {
  initial: Client;
  readings: Reading[];
  onSave: (c: Client) => void;
  onDelete: () => void;
  onHome: () => void;
  onOpenReading: (id: string) => void;
  onNewReading: (c: Client, kind: 'natal' | 'year', year: number, system: System) => void;
}) {
  const { value: c, change, discard, status } = useAutosave(props.initial, props.onSave, isClientBlank);
  const chart = buildChart(c.birth, new Date().getFullYear());
  const birthKey = JSON.stringify(c.birth);
  const vedic = useMemo(() => buildVedicChart(c.birth, new Date().getFullYear()), [birthKey]);
  // 看哪套盘；有吠陀测算记录、又填了出生地的命主默认先看吠陀。
  const [view, setView] = useState<System>(() => (props.initial.birth.place && props.readings.some((r) => r.system === 'vedic') && !props.readings.some((r) => r.system === 'bazi') ? 'vedic' : 'bazi'));
  // 出生信息已经能排盘的默认收起表单，新建或信息不全时展开。
  const [editing, setEditing] = useState(() => !buildChart(props.initial.birth, 2000) || !props.initial.name.trim());
  const remove = useCallback(() => {
    const n = props.readings.length;
    if (!window.confirm(`删除命主「${c.name || '未填称呼'}」${n ? `和 TA 的 ${n} 次测算` : ''}？手机和电脑上都会消失，不能恢复。`)) return;
    discard();
    props.onDelete();
  }, [c.name, discard, props]);

  return (
    <div className="page">
      <PageBar crumbs={[{ label: '命主', onClick: props.onHome }]} status={isClientBlank(c) ? null : status} />

      {editing ? (
        <section className="block">
          <label className="field">
            <span>称呼</span>
            <input value={c.name} placeholder="怎么称呼" onChange={(e) => change({ name: e.target.value })} />
          </label>
          <BirthEditor birth={c.birth} onChange={(birth) => change({ birth })} />
          <label className="field">
            <span>备注（只有你看得到）</span>
            <textarea rows={2} placeholder="职业、近况、上次聊到的事" value={c.note} onChange={(e) => change({ note: e.target.value })} />
          </label>
          {chart && c.name.trim() && <button type="button" className="btn" onClick={() => setEditing(false)}>完成</button>}
        </section>
      ) : (
        <header className="client-head">
          <h1>{c.name}</h1>
          <p>
            {chart?.solarText.replace('公历 ', '')}出生，{chart?.genderText}
            <br />
            {chart?.lunarText}
          </p>
          {c.birth.place && <p className="place">出生地：{c.birth.place.name || '手填坐标'}</p>}
          {c.note.trim() && <p className="note">{c.note.trim()}</p>}
          <button type="button" className="link" onClick={() => setEditing(true)}>修改资料</button>
        </header>
      )}

      {chart && (
        <div className="seg system-tabs">
          {(['bazi', 'vedic'] as const).map((s) => (
            <button type="button" key={s} className={view === s ? 'on' : ''} onClick={() => setView(s)}>{SYSTEM_LABELS[s]}</button>
          ))}
        </div>
      )}

      {chart && view === 'vedic' ? (
        vedic ? (
          <section className="block chart-block">
            <VedicView chart={vedic} />
          </section>
        ) : (
          <p className="hint">
            吠陀星盘要用出生地来定上升和宫位。
            <button type="button" className="link" onClick={() => setEditing(true)}>去填出生地</button>
          </p>
        )
      ) : chart ? (
        <section className="block chart-block">
          <ChartView chart={chart} />
        </section>
      ) : (
        <p className="hint">{c.birth.date.replace(/-/g, '') ? '这个日期不存在，请检查（农历注意闰月和小月）。' : '填好出生日期，这里会自动排出命盘。'}</p>
      )}

      {chart && (
        <section className="block">
          <h2>新建{SYSTEM_LABELS[view]}测算</h2>
          <NewReadingButtons key={view} system={view} hasPlace={Boolean(c.birth.place)} onCreate={(kind, year, system) => props.onNewReading(c, kind, year, system)} />
        </section>
      )}

      {props.readings.length > 0 && (
        <section className="block">
          <h2>测算记录</h2>
          <ul className="rows">
            {props.readings.map((r) => (
              <li key={r.id}>
                <button type="button" className="row" onClick={() => props.onOpenReading(r.id)}>
                  <span className="row-main">
                    <span className="row-title">{readingTitle(r)}</span>
                  </span>
                  <span className="row-side">
                    {formatDate(r.createdAt)}
                    {!r.interpretation.trim() && <em className="todo">未完成</em>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!isClientBlank(c) && (
        <button type="button" className="link danger" onClick={remove}>删除这位命主</button>
      )}
    </div>
  );
}
