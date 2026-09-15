import { useCallback, useEffect, useState } from 'react';

export function useHashRoute(): [string, (hash: string) => void] {
  const [hash, setHash] = useState(() => window.location.hash || '#/');
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const go = useCallback((next: string) => {
    window.location.hash = next;
  }, []);
  return [hash, go];
}
