import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Client, Doc, Reading, Settings } from '../domain/types';
import { claimLocalFor, loadLocal, writeLocal, type LocalState } from './local';
import { idsToPush, mergeDocs, sortByCreatedDesc } from './merge';
import { deleteRemote, fetchRemote, pushRemote } from './remote';

export function useDocs(userId: string) {
  const [view, setView] = useState<LocalState>({ docs: [], pending: [], deleting: [] });
  const [loaded, setLoaded] = useState(false);
  const state = useRef<LocalState>(view);
  const pushing = useRef(false);

  const commit = useCallback((next: LocalState) => {
    state.current = next;
    setView(next);
    void writeLocal(next);
  }, []);

  const push = useCallback(async () => {
    const { docs, pending: ids, deleting } = state.current;
    if (pushing.current || (!ids.length && !deleting.length)) return;
    pushing.current = true;
    const batch = docs.filter((d) => ids.includes(d.id));
    let again = false;
    try {
      await pushRemote(batch);
      const pushedAt = new Map(batch.map((d) => [d.id, d.updatedAt]));
      const cur = state.current;
      const left = cur.pending.filter((id) => {
        const d = cur.docs.find((x) => x.id === id);
        return d !== undefined && pushedAt.get(id) !== d.updatedAt;
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
      commit({ ...local, docs: sortByCreatedDesc(local.docs) });
      setLoaded(true);
      try {
        const remote = await fetchRemote();
        if (cancelled) return;
        const cur = state.current;
        commit({
          docs: mergeDocs(cur.docs, remote, cur.pending, cur.deleting),
          pending: idsToPush(cur.docs, remote, cur.pending),
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

  const saveDoc = useCallback(
    (d: Doc) => {
      const cur = state.current;
      if (cur.deleting.includes(d.id)) return;
      const stamped: Doc = { ...d, updatedAt: new Date().toISOString() };
      const exists = cur.docs.some((x) => x.id === d.id);
      const docs = exists ? cur.docs.map((x) => (x.id === d.id ? stamped : x)) : sortByCreatedDesc([stamped, ...cur.docs]);
      const pending = cur.pending.includes(d.id) ? cur.pending : [...cur.pending, d.id];
      commit({ ...cur, docs, pending });
      void push();
    },
    [commit, push],
  );

  const deleteDocs = useCallback(
    (ids: string[]) => {
      const cur = state.current;
      commit({
        docs: cur.docs.filter((x) => !ids.includes(x.id)),
        pending: cur.pending.filter((x) => !ids.includes(x)),
        deleting: [...new Set([...cur.deleting, ...ids])],
      });
      void push();
    },
    [commit, push],
  );

  const clients = useMemo(() => view.docs.filter((d): d is Client => d.type === 'client'), [view.docs]);
  const readings = useMemo(() => view.docs.filter((d): d is Reading => d.type === 'reading'), [view.docs]);
  const settings = useMemo(() => view.docs.find((d): d is Settings => d.type === 'settings') ?? null, [view.docs]);

  return {
    clients,
    readings,
    settings,
    loaded,
    synced: view.pending.length === 0 && view.deleting.length === 0,
    saveDoc,
    deleteDocs,
  };
}
