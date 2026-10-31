import { useCallback, useEffect, useRef, useState } from 'react';

// 编辑停顿 1 秒自动保存；切到后台、离开页面时立即保存。skip 为真时（如空白草稿）不保存。
export function useAutosave<T>(initial: T, onSave: (v: T) => void, skip: (v: T) => boolean) {
  const [value, setValue] = useState(initial);
  const latest = useRef(value);
  latest.current = value;
  const dirty = useRef(false);

  const change = useCallback((patch: Partial<T>) => {
    dirty.current = true;
    setValue((prev) => ({ ...prev, ...patch }));
  }, []);

  const flush = useCallback(() => {
    if (!dirty.current || skip(latest.current)) return;
    dirty.current = false;
    onSave(latest.current);
  }, [onSave, skip]);

  // 删除前调用，避免离开页面时把刚删的记录又存回去。
  const discard = useCallback(() => {
    dirty.current = false;
  }, []);

  useEffect(() => {
    if (!dirty.current) return;
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

  return { value, change, discard };
}
