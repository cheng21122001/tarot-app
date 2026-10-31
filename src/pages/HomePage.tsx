import { useState } from 'react';
import { buildChart, pillarsText } from '../bazi/chart';
import { KIND_LABELS, readingTitle, type Client, type Reading } from '../domain/types';
import { formatDate, groupByMonth } from '../reading/format';
import { NewReadingButtons } from './NewReading';

type Tab = 'readings' | 'clients';

export function HomePage(props: {
  tab: Tab;
  clients: Client[];
  readings: Reading[];
  onTab: (t: Tab) => void;
  onOpenReading: (id: string) => void;
  onOpenClient: (id: string) => void;
  onNewClient: () => void;
  onNewReading: (client: Client, kind: 'natal' | 'year', year: number) => void;
  onSignOut: () => void;
}) {
  const { tab, clients, readings } = props;
  const [query, setQuery] = useState('');
  const [picking, setPicking] = useState(false);
  const q = query.trim().toLowerCase();
  const byId = new Map(clients.map((c) => [c.id, c]));
  const nameOf = (r: Reading) => byId.get(r.clientId)?.name || r.clientName || '未填称呼';

  const shownReadings = q
    ? readings.filter((r) => nameOf(r).toLowerCase().includes(q) || r.focus.toLowerCase().includes(q) || readingTitle(r).includes(q))
    : readings;
  const shownClients = q ? clients.filter((c) => c.name.toLowerCase().includes(q) || c.note.toLowerCase().includes(q)) : clients;

  return (
    <div className="page">
      <header className="list-header">
        <h1>小艾</h1>
        <button type="button" className="text-btn" onClick={props.onSignOut}>退出</button>
      </header>
      <div className="tabs">
        <button type="button" className={tab === 'readings' ? 'on' : ''} onClick={() => props.onTab('readings')}>测算记录</button>
        <button type="button" className={tab === 'clients' ? 'on' : ''} onClick={() => props.onTab('clients')}>客人</button>
      </div>
      <input type="search" placeholder={tab === 'readings' ? '搜客人、关注点' : '搜称呼、备注'} value={query} onChange={(e) => setQuery(e.target.value)} />

      {tab === 'readings' ? (
        <>
          {shownReadings.length === 0 && <p className="empty">{readings.length ? '没有匹配的记录' : '还没有测算记录，点右下角开始'}</p>}
          {groupByMonth(shownReadings).map((g) => (
            <section key={g.label}>
              <h2 className="month">
                {g.label}
                <span>{g.items.length} 次</span>
              </h2>
              <ul className="item-list">
                {g.items.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="item" onClick={() => props.onOpenReading(r.id)}>
                      <span className={`kind kind-${r.kind}`}>{r.kind === 'year' ? r.year : '命'}</span>
                      <div className="item-text">
                        <div className="item-top">
                          <span className="item-name">{nameOf(r)}</span>
                          <span className="item-date">{formatDate(r.createdAt)}</span>
                        </div>
                        <div className="item-sub">{readingTitle(r)}{r.focus.trim() ? ` · ${r.focus.trim()}` : ''}</div>
                        {!r.interpretation.trim() && <span className="badge">未完成</span>}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      ) : (
        <>
          {shownClients.length === 0 && <p className="empty">{clients.length ? '没有匹配的客人' : '还没有客人，点右下角添加'}</p>}
          <ul className="item-list">
            {shownClients.map((c) => (
              <ClientItem key={c.id} client={c} count={readings.filter((r) => r.clientId === c.id).length} onOpen={() => props.onOpenClient(c.id)} />
            ))}
          </ul>
        </>
      )}

      <button type="button" className="fab" onClick={() => (tab === 'clients' ? props.onNewClient() : setPicking(true))} aria-label={tab === 'clients' ? '添加客人' : '新建测算'}>＋</button>
      {picking && <ClientPicker clients={clients} onNewClient={props.onNewClient} onCreate={props.onNewReading} onClose={() => setPicking(false)} />}
    </div>
  );
}

function ClientItem({ client: c, count, onOpen }: { client: Client; count: number; onOpen: () => void }) {
  const chart = buildChart(c.birth, new Date().getFullYear());
  return (
    <li>
      <button type="button" className="item" onClick={onOpen}>
        <div className="item-text">
          <div className="item-top">
            <span className="item-name">{c.name || '未填称呼'}</span>
            <span className="item-date">{count ? `${count} 次测算` : ''}</span>
          </div>
          <div className="item-sub">{chart ? `${pillarsText(chart)} · ${chart.genderText}` : '出生信息未填完'}</div>
        </div>
      </button>
    </li>
  );
}

function ClientPicker({ clients, onNewClient, onCreate, onClose }: { clients: Client[]; onNewClient: () => void; onCreate: (c: Client, kind: 'natal' | 'year', year: number) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<Client | null>(null);
  const q = query.trim().toLowerCase();
  const shown = q ? clients.filter((c) => c.name.toLowerCase().includes(q)) : clients;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <strong>{chosen ? `给 ${chosen.name || '这位客人'} 新建` : '选择客人'}</strong>
          <button type="button" className="text-btn" onClick={chosen ? () => setChosen(null) : onClose}>{chosen ? '换客人' : '取消'}</button>
        </div>
        <div className="sheet-body">
          {chosen ? (
            <>
              <p className="hint">{KIND_LABELS.natal}看一生格局；{KIND_LABELS.year}看某一年，含逐月提示。</p>
              <NewReadingButtons onCreate={(kind, year) => onCreate(chosen, kind, year)} />
            </>
          ) : (
            <>
              <button type="button" className="chip" onClick={onNewClient}>＋ 新客人</button>
              {clients.length > 6 && <input type="search" placeholder="搜称呼" value={query} onChange={(e) => setQuery(e.target.value)} />}
              <ul className="item-list">
                {shown.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="item" onClick={() => setChosen(c)}>
                      <span className="item-name">{c.name || '未填称呼'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
