import { useEffect, useRef, useState } from 'react';
import type { ParsedInterpretation } from '../reading/parse';
import { formatDate } from '../reading/search';
import type { Reading, Theme } from '../reading/types';
import { LongImage } from './LongImage';
import { renderLongImage } from './render';

type State = { status: 'working' } | { status: 'done'; blob: Blob; url: string } | { status: 'error' };

export function ExportModal({ reading, parsed, theme, onClose }: { reading: Reading; parsed: ParsedInterpretation; theme: Theme; onClose: () => void }) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>({ status: 'working' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    setState({ status: 'working' });
    (async () => {
      try {
        const blob = await renderLongImage(nodeRef.current!);
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setState({ status: 'done', blob, url });
      } catch (e) {
        console.error('long image failed', e);
        if (!cancelled) setState({ status: 'error' });
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [attempt, theme]);

  const fileName = `塔罗-${reading.clientName.trim() || '客人'}-${formatDate(reading.createdAt)}.png`;

  const save = () => {
    if (state.status !== 'done') return;
    const file = new File([state.blob], fileName, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file] }).catch(() => undefined);
      return;
    }
    const a = document.createElement('a');
    a.href = state.url;
    a.download = fileName;
    a.click();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal export" onClick={(e) => e.stopPropagation()}>
        <div className="export-head">
          <button type="button" className="text-btn" onClick={onClose}>关闭</button>
          <button type="button" className="primary" disabled={state.status !== 'done'} onClick={save}>保存 / 分享</button>
        </div>
        <div className="export-body">
          {state.status === 'working' && <p className="hint">正在生成…</p>}
          {state.status === 'error' && (
            <p className="hint">
              生成失败 <button type="button" className="text-btn" onClick={() => setAttempt((a) => a + 1)}>重试</button>
            </p>
          )}
          {state.status === 'done' && (
            <>
              <p className="hint">手机上也可以长按图片保存</p>
              <img className="export-preview" src={state.url} alt="长图预览" />
            </>
          )}
        </div>
        <div className="offscreen">
          <div ref={nodeRef}>
            <LongImage reading={reading} parsed={parsed} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}
