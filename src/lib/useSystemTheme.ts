import { useEffect, useState } from 'react';
import type { Theme } from '../reading/types';

const query = '(prefers-color-scheme: dark)';

export function useSystemTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => (window.matchMedia(query).matches ? 'night' : 'day'));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setTheme(mq.matches ? 'night' : 'day');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return theme;
}
