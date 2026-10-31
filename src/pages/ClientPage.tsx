import { useCallback, useState } from 'react';
import { buildChart } from '../bazi/chart';
import { BirthEditor } from '../components/BirthEditor';
import { ChartView } from '../components/ChartView';
import { PageBar } from '../components/PageBar';
import { isClientBlank, readingTitle, type Client, type Reading } from '../domain/types';
import { useAutosave } from '../lib/useAutosave';
import { formatDate } from '../reading/format';
import { NewReadingButtons } from './NewReading';

export function ClientPage(props: {
  initial: Client;
  readings: Reading[];
  onSave: (c: Client) => void;
  onDelete: () => void;
  onHome: () => void;
  onOpenReading: (id: string) => void;
  onNewReading: (c: Client, kind: 'natal' | 'year', year: number) => void;
}) {
  const { value: c, change, discard, status } = useAutosave(props.initial, props.onSave, isClientBlank);
  const chart = buildChart(c.birth, new Date().getFullYear());
  // 出生信息已经能排盘的老客人默认收起表单，新客人或信息不全时展开。
  const [editing, setEditing] = useState(() => !buildChart(props.initial.birth, 2000) || !props.initial.name.trim());
  const remove = useCallback(() => {
    const n = props.readings.length;
    if (!window.confirm(`删除客人「${c.name || '未填称呼'}」${n ? `和 TA 的 ${n} 次测算` : ''}？手机和电脑上都会消失，不能恢复。`)) return;
    discard();
    props.onDelete();
  }, [c.name, discard, props]);

  return (
    <div className="page">
      <PageBar crumbs={[{ label: '客人', onClick: props.onHome }]} status={isClientBlank(c) ? null : status} />

      {editing ? (
        <section className="block">
          <label className="field">
            <span>称呼</span>
            <input value={c.name} placeholder="客人怎么称呼" onChange={(e) => change({ name: e.target.value })} />
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
          {c.note.trim() && <p className="note">{c.note.trim()}</p>}
          <button type="button" className="link" onClick={() => setEditing(true)}>修改资料</button>
        </header>
      )}

      {chart ? (
        <section className="block chart-block">
          <ChartView chart={chart} />
        </section>
      ) : (
        <p className="hint">{c.birth.date.replace(/-/g, '') ? '这个日期不存在，请检查（农历注意闰月和小月）。' : '填好出生日期，这里会自动排出命盘。'}</p>
      )}

      {chart && (
        <section className="block">
          <h2>新建测算</h2>
          <NewReadingButtons onCreate={(kind, year) => props.onNewReading(c, kind, year)} />
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
                    {r.focus.trim() && <span className="row-sub">{r.focus.trim()}</span>}
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
        <button type="button" className="link danger" onClick={remove}>删除这位客人</button>
      )}
    </div>
  );
}
