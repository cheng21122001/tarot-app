import { useCallback, useEffect, useRef, useState } from 'react';
import type { Reading } from '../reading/types';
import { claimLocalFor, loadLocal, writeLocal } from './local';
import { idsToPush, mergeReadings, sortByCreatedDesc } from './merge';
import { fetchRemote, pushRemote } from './remote';

export function useReadings(userId: string) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const state = useRef<{ readings: Reading[]; pending: string[] }>({ readings: [], pending: [] });
  const pushing = useRef(false);

  const commit = useCallback((next: Reading[], nextPending: string[]) => {
    state.current = { readings: next, pending: nextPending };
    setReadings(next);
    setPending(nextPending);
    void writeLocal(next, nextPending);
  }, []);

  const push = useCallback(async () => {
    if (pushing.current || !state.current.pending.length) return;
    pushing.current = true;
    const { readings: list, pending: ids } = state.current;
    const batch = list.filter((r) => ids.includes(r.id));
    let again = false;
    try {
      await pushRemote(batch);
      const pushedAt = new Map(batch.map((r) => [r.id, r.updatedAt]));
      const cur = state.current;
      const left = cur.pending.filter((id) => {
        const r = cur.readings.find((x) => x.id === id);
        return r !== undefined && pushedAt.get(id) !== r.updatedAt;
      });
      commit(cur.readings, left);
      again = left.length > 0;
    } catch (e) {
      console.warn('push failed, will retry', e);
    } finally {
      pushing.current = false;
    }
    if (again) void push();
  }, [commit]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await claimLocalFor(userId);
      const local = await loadLocal();
      if (cancelled) return;
      commit(sortByCreatedDesc(local.readings), local.pending);
      setLoaded(true);
      try {
        const remote = await fetchRemote();
        if (cancelled) return;
        const cur = state.current;
        commit(mergeReadings(cur.readings, remote), idsToPush(cur.readings, remote, cur.pending));
        await push();
      } catch (e) {
        console.warn('fetch failed, staying local', e);
      }
    })();
    const onOnline = () => void push();
    window.addEventListener('online', onOnline);
    const timer = window.setInterval(() => void push(), 30_000);
    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
      window.clearInterval(timer);
    };
  }, [userId, commit, push]);

  const saveReading = useCallback(
    (r: Reading) => {
      const stamped: Reading = { ...r, updatedAt: new Date().toISOString() };
      const cur = state.current;
      const exists = cur.readings.some((x) => x.id === r.id);
      const next = exists ? cur.readings.map((x) => (x.id === r.id ? stamped : x)) : sortByCreatedDesc([stamped, ...cur.readings]);
      const nextPending = cur.pending.includes(r.id) ? cur.pending : [...cur.pending, r.id];
      commit(next, nextPending);
      void push();
    },
    [commit, push],
  );

  return { readings, loaded, synced: pending.length === 0, saveReading };
}
