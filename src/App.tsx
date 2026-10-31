import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './data/supabase';
import { useDocs } from './data/useDocs';
import { newClient, newReading, type Client, type Doc } from './domain/types';
import { useHashRoute } from './lib/useHashRoute';
import { useSwipeBack } from './lib/useSwipeBack';
import { ClientPage } from './pages/ClientPage';
import { HomePage } from './pages/HomePage';
import { Login } from './pages/Login';
import { ReadingPage } from './pages/ReadingPage';
import './pages/pages.css';

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // 仅开发环境：?local 跳过登录，用来在本机预览界面（不会进生产包）。
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('local')) return <Shell userId="local-dev" />;
  if (session === undefined) return null;
  if (!session) return <Login />;
  return <Shell userId={session.user.id} />;
}

function Shell({ userId }: { userId: string }) {
  const { clients, readings, loaded, synced, saveDoc, deleteDocs } = useDocs(userId);
  const [hash, go] = useHashRoute();
  const drafts = useRef(new Map<string, Client>());
  const route = hash.match(/^#\/([cr])\/([0-9a-f-]+)$/);
  // 返回上一页；直接打开深层链接没有上一页时，测算回记录、客人回客人列表。
  const back = useCallback(() => {
    if (window.history.length > 1) window.history.back();
    else go(route?.[1] === 'c' ? '#/clients' : '#/');
  }, [go, route?.[1]]);
  useSwipeBack(Boolean(route), back);

  const startReading = (c: Client, kind: 'natal' | 'year', year: number) => {
    const r = newReading(c, kind, year);
    saveDoc(r);
    go(`#/r/${r.id}`);
  };
  const createClient = () => {
    const c = newClient();
    drafts.current.set(c.id, c);
    go(`#/c/${c.id}`);
  };
  const notFound = (
    <div className="page">
      <p className="empty">找不到这条记录</p>
      <button type="button" className="link" onClick={() => go("#/")}>返回首页</button>
    </div>
  );

  let page = null;
  if (route?.[1] === 'c') {
    const c = clients.find((x) => x.id === route[2]) ?? drafts.current.get(route[2]);
    if (c) {
      const own = readings.filter((r) => r.clientId === c.id);
      page = (
        <ClientPage
          key={c.id}
          initial={c}
          readings={own}
          onSave={(next) => {
            saveDoc(next);
            // 读数列表里存的是建测算时的称呼，改名后顺带更新。
            for (const r of own) if (r.clientName !== next.name) saveDoc({ ...r, clientName: next.name });
          }}
          onDelete={() => {
            drafts.current.delete(c.id);
            deleteDocs([c.id, ...own.map((r) => r.id)]);
            go('#/clients');
          }}
          onHome={() => go('#/clients')}
          onOpenReading={(id) => go(`#/r/${id}`)}
          onNewReading={startReading}
        />
      );
    } else if (loaded) page = notFound;
  } else if (route?.[1] === 'r') {
    const r = readings.find((x) => x.id === route[2]);
    if (r) {
      const client = clients.find((x) => x.id === r.clientId) ?? null;
      page = (
        <ReadingPage
          key={r.id}
          initial={r}
          client={client}
          onSave={(next) => saveDoc(next as Doc)}
          onDelete={() => {
            deleteDocs([r.id]);
            back();
          }}
          onHome={() => go('#/')}
          onOpenClient={() => go(`#/c/${r.clientId}`)}
        />
      );
    } else if (loaded) page = notFound;
  } else {
    page = (
      <HomePage
        tab={hash === '#/clients' ? 'clients' : 'readings'}
        clients={clients}
        readings={readings}
        onTab={(t) => go(t === 'clients' ? '#/clients' : '#/')}
        onOpenReading={(id) => go(`#/r/${id}`)}
        onOpenClient={(id) => go(`#/c/${id}`)}
        onNewClient={createClient}
        onNewReading={startReading}
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
