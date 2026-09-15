import type { Session } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { supabase } from './data/supabase';
import { useReadings } from './data/useReadings';
import { useHashRoute } from './lib/useHashRoute';
import { ListPage } from './pages/ListPage';
import { Login } from './pages/Login';
import { ReadingPage } from './pages/ReadingPage';
import { newReading, type Reading } from './reading/types';

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (!session) return <Login />;
  return <Shell userId={session.user.id} />;
}

function Shell({ userId }: { userId: string }) {
  const { readings, loaded, synced, saveReading } = useReadings(userId);
  const [hash, go] = useHashRoute();
  const drafts = useRef(new Map<string, Reading>());

  const match = hash.match(/^#\/r\/([0-9a-f-]+)$/);
  let page = null;
  if (match) {
    const r = readings.find((x) => x.id === match[1]) ?? drafts.current.get(match[1]);
    if (r) {
      page = <ReadingPage key={r.id} initial={r} onSave={saveReading} onBack={() => go('#/')} />;
    } else if (loaded) {
      page = (
        <div className="page">
          <p className="empty">找不到这条记录</p>
          <button type="button" className="text-btn" onClick={() => go('#/')}>返回列表</button>
        </div>
      );
    }
  } else {
    page = (
      <ListPage
        readings={readings}
        onOpen={(id) => go(`#/r/${id}`)}
        onNew={() => {
          const r = newReading();
          drafts.current.set(r.id, r);
          go(`#/r/${r.id}`);
        }}
        onSignOut={() => void supabase.auth.signOut()}
      />
    );
  }

  return (
    <>
      {!synced && <div className="sync-badge">未同步</div>}
      {page}
    </>
  );
}
