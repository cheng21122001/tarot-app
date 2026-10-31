import { useCallback } from 'react';
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
  onBack: () => void;
  onOpenReading: (id: string) => void;
  onNewReading: (c: Client, kind: 'natal' | 'year', year: number) => void;
}) {
  const { value: c, change, discard, status } = useAutosave(props.initial, props.onSave, isClientBlank);
  const chart = buildChart(c.birth, new Date().getFullYear());
  const remove = useCallback(() => {
    const n = props.readings.length;
    if (!window.confirm(`删除客人「${c.name || '未填称呼'}」${n ? `和 TA 的 ${n} 次测算` : ''}？手机和电脑上都会消失，不能恢复。`)) return;
    discard();
    props.onDelete();
  }, [c.name, discard, props]);

  return (
    <div className="page">
      <PageBar title={c.name.trim() || '新客人'} status={isClientBlank(c) ? null : status} onBack={props.onBack} />
      <section className="section">
        <h2>客人</h2>
        <label className="field">
          <span>称呼</span>
          <input value={c.name} onChange={(e) => change({ name: e.target.value })} />
        </label>
        <BirthEditor birth={c.birth} onChange={(birth) => change({ birth })} />
        <label className="field">
          <span>备注（职业、近况等，只自己看）</span>
          <textarea rows={2} value={c.note} onChange={(e) => change({ note: e.target.value })} />
        </label>
      </section>

      <section className="section">
        <h2>命盘</h2>
        {chart ? <ChartView chart={chart} /> : <p className="hint">{c.birth.date.replace(/-/g, '') ? '这个日期不存在，请检查（农历注意闰月和小月）' : '填好出生日期后自动排盘'}</p>}
      </section>

      <section className="section">
        <h2>测算</h2>
        {chart ? <NewReadingButtons onCreate={(kind, year) => props.onNewReading(c, kind, year)} /> : <p className="hint">出生信息填好后可以新建测算</p>}
        <ul className="item-list">
          {props.readings.map((r) => (
            <li key={r.id}>
              <button type="button" className="item" onClick={() => props.onOpenReading(r.id)}>
                <div className="item-text">
                  <div className="item-top">
                    <span className="item-name">{readingTitle(r)}</span>
                    <span className="item-date">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.focus.trim() && <div className="item-sub">{r.focus.trim()}</div>}
                  {!r.interpretation.trim() && <span className="badge">未完成</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <button type="button" className="text-btn danger" onClick={remove}>删除这位客人</button>
      </section>
    </div>
  );
}
