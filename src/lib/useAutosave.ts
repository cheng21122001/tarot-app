import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'saved' | 'saving';

// 编辑停顿 1 秒自动保存；切到后台、离开页面时立即保存。skip 为真时（如空白草稿）不保存。
// change(patch, true) 或 saveNow() 立即保存，用于粘贴解读、点保存按钮。
export function useAutosave<T>(initial: T, onSave: (v: T) => void, skip: (v: T) => boolean) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const latest = useRef(value);
  latest.current = value;
  const dirty = useRef(false);
  const immediate = useRef(false);

  const change = useCallback((patch: Partial<T>, now = false) => {
    dirty.current = true;
    immediate.current = now;
    setStatus('saving');
    setValue((prev) => ({ ...prev, ...patch }));
  }, []);

  const flush = useCallback(() => {
    if (!dirty.current) return;
    if (skip(latest.current)) {
      setStatus('saved');
      return;
    }
    dirty.current = false;
    onSave(latest.current);
    setStatus('saved');
  }, [onSave, skip]);

  // 删除前调用，避免离开页面时把刚删的记录又存回去。
  const discard = useCallback(() => {
    dirty.current = false;
  }, []);

  useEffect(() => {
    if (!dirty.current) return;
    if (immediate.current) {
      immediate.current = false;
      flush();
      return;
    }
    const t = window.setTimeout(flush, 1000);
    return () => window.clearTimeout(t);
  }, [value, flush]);

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

  return { value, change, discard, saveNow: flush, status };
}
