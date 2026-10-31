import { useCallback, useEffect, useRef, useState } from 'react';
import { isBlank, type Reading } from '../reading/types';
import { CardSlots } from './reading/CardSlots';
import { ExportSection } from './reading/ExportSection';
import { InterpretationSection } from './reading/InterpretationSection';
import { QuestionSection } from './reading/QuestionSection';
import './reading.css';

export function ReadingPage({ initial, onSave, onDelete, onBack }: { initial: Reading; onSave: (r: Reading) => void; onDelete: () => void; onBack: () => void }) {
  const [reading, setReading] = useState(initial);
  const latest = useRef(reading);
  latest.current = reading;
  const dirty = useRef(false);

  const onChange = useCallback((patch: Partial<Reading>) => {
    dirty.current = true;
    setReading((prev) => ({ ...prev, ...patch }));
  }, []);

  const flush = useCallback(() => {
    if (!dirty.current || isBlank(latest.current)) return;
    dirty.current = false;
    onSave(latest.current);
  }, [onSave]);

  useEffect(() => {
    if (!dirty.current) return;
    const t = window.setTimeout(flush, 1000);
    return () => window.clearTimeout(t);
  }, [reading, flush]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  const remove = () => {
    if (!window.confirm('删除这条测算记录？删除后手机和电脑上都会消失，不能恢复。')) return;
    dirty.current = false;
    onDelete();
  };

  return (
    <div className="page">
      <button type="button" className="text-btn back" onClick={onBack}>‹ 记录</button>
      <QuestionSection reading={reading} onChange={onChange} />
      <CardSlots reading={reading} onChange={onChange} />
      <InterpretationSection reading={reading} onChange={onChange} />
      <ExportSection reading={reading} onChange={onChange} />
      <section className="section">
        <button type="button" className="text-btn danger" onClick={remove}>删除这条记录</button>
      </section>
    </div>
  );
}
