import { useCallback, useEffect, useRef, useState } from 'react';
import type { Reading } from '../reading/types';
import { claimLocalFor, loadLocal, writeLocal, type LocalState } from './local';
import { idsToPush, mergeReadings, sortByCreatedDesc } from './merge';
import { deleteRemote, fetchRemote, pushRemote } from './remote';

export function useReadings(userId: string) {
  const [view, setView] = useState<LocalState>({ readings: [], pending: [], deleting: [] });
  const [loaded, setLoaded] = useState(false);
  const state = useRef<LocalState>(view);
  const pushing = useRef(false);

  const commit = useCallback((next: LocalState) => {
    state.current = next;
    setView(next);
    void writeLocal(next);
  }, []);

  const push = useCallback(async () => {
    const { readings: list, pending: ids, deleting } = state.current;
    if (pushing.current || (!ids.length && !deleting.length)) return;
    pushing.current = true;
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
      commit({ ...cur, pending: left });
      again = left.length > 0;

      const gone = await deleteRemote(deleting);
      if (gone.length) commit({ ...state.current, deleting: state.current.deleting.filter((id) => !gone.includes(id)) });
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
      commit({ ...local, readings: sortByCreatedDesc(local.readings) });
      setLoaded(true);
      try {
        const remote = await fetchRemote();
        if (cancelled) return;
        const cur = state.current;
        commit({
          readings: mergeReadings(cur.readings, remote, cur.pending, cur.deleting),
          pending: idsToPush(cur.readings, remote, cur.pending),
          deleting: cur.deleting,
        });
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
      if (cur.deleting.includes(r.id)) return;
      const exists = cur.readings.some((x) => x.id === r.id);
      const readings = exists ? cur.readings.map((x) => (x.id === r.id ? stamped : x)) : sortByCreatedDesc([stamped, ...cur.readings]);
      const pending = cur.pending.includes(r.id) ? cur.pending : [...cur.pending, r.id];
      commit({ ...cur, readings, pending });
      void push();
    },
    [commit, push],
  );

  const deleteReading = useCallback(
    (id: string) => {
      const cur = state.current;
      commit({
        readings: cur.readings.filter((x) => x.id !== id),
        pending: cur.pending.filter((x) => x !== id),
        deleting: cur.deleting.includes(id) ? cur.deleting : [...cur.deleting, id],
      });
      void push();
    },
    [commit, push],
  );

  return {
    readings: view.readings,
    loaded,
    synced: view.pending.length === 0 && view.deleting.length === 0,
    saveReading,
    deleteReading,
  };
}
