import { useMemo, useState } from 'react';
import { buildChart, today } from '../bazi/chart';
import { Gz } from '../components/Gz';
import { readingTitle, type Client, type Reading } from '../domain/types';
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
  const day = useMemo(() => today(), []);
  const q = query.trim().toLowerCase();
  const byId = new Map(clients.map((c) => [c.id, c]));
  const nameOf = (r: Reading) => byId.get(r.clientId)?.name || r.clientName || '未填称呼';

  const shownReadings = q
    ? readings.filter((r) => nameOf(r).toLowerCase().includes(q) || r.focus.toLowerCase().includes(q) || readingTitle(r).includes(q))
    : readings;
  const shownClients = q ? clients.filter((c) => c.name.toLowerCase().includes(q) || c.note.toLowerCase().includes(q)) : clients;

  return (
    <div className="page">
      <header className="today">
        <div className="today-top">
          <span>今天 {day.lunar}</span>
          <button type="button" className="link" onClick={props.onSignOut}>退出登录</button>
        </div>
        <div className="today-gz">
          {day.ganZhi.map((g, i) => (
            <span key={i}>
              <Gz text={g} />
              <small>{'年月日'[i]}</small>
            </span>
          ))}
        </div>
      </header>

      <div className="home-tools">
        <div className="seg">
          <button type="button" className={tab === 'readings' ? 'on' : ''} onClick={() => props.onTab('readings')}>测算记录</button>
          <button type="button" className={tab === 'clients' ? 'on' : ''} onClick={() => props.onTab('clients')}>客人 {clients.length || ''}</button>
        </div>
        <input type="search" placeholder={tab === 'readings' ? '搜客人或关注点' : '搜称呼或备注'} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {tab === 'readings' ? (
        <>
          {shownReadings.length === 0 && (
            <p className="empty">{readings.length ? '没有匹配的记录。' : clients.length ? '还没有测算。点下面的按钮，选一位客人开始。' : '先添加一位客人，录入出生信息就能排盘。'}</p>
          )}
          {groupByMonth(shownReadings).map((g) => (
            <section key={g.label} className="month">
              <h2>
                {g.label}
                <span>{g.items.length} 次</span>
              </h2>
              <ul className="rows">
                {g.items.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="row" onClick={() => props.onOpenReading(r.id)}>
                      <span className="row-main">
                        <span className="row-title kai">{nameOf(r)}</span>
                        <span className="row-sub">{readingTitle(r)}{r.focus.trim() ? `，${r.focus.trim()}` : ''}</span>
                      </span>
                      <span className="row-side">
                        {formatDate(r.createdAt).slice(5)}
                        {!r.interpretation.trim() && <em className="todo">未完成</em>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      ) : (
        <>
          {shownClients.length === 0 && <p className="empty">{clients.length ? '没有匹配的客人。' : '还没有客人。点下面的按钮添加第一位。'}</p>}
          <ul className="rows">
            {shownClients.map((c) => (
              <ClientRow key={c.id} client={c} count={readings.filter((r) => r.clientId === c.id).length} onOpen={() => props.onOpenClient(c.id)} />
            ))}
          </ul>
        </>
      )}

      <button type="button" className="fab" onClick={() => (tab === 'clients' || !clients.length ? props.onNewClient() : setPicking(true))}>
        {tab === 'clients' || !clients.length ? '添加客人' : '新建测算'}
      </button>
      {picking && <ClientPicker clients={clients} onNewClient={props.onNewClient} onCreate={props.onNewReading} onClose={() => setPicking(false)} />}
    </div>
  );
}

function ClientRow({ client: c, count, onOpen }: { client: Client; count: number; onOpen: () => void }) {
  const chart = buildChart(c.birth, new Date().getFullYear());
  return (
    <li>
      <button type="button" className="row" onClick={onOpen}>
        <span className="row-main">
          <span className="row-title kai">{c.name || '未填称呼'}</span>
          {chart ? (
            <span className="row-gz">
              {chart.pillars.map((p) => <Gz key={p.label} text={p.gan + p.zhi} />)}
            </span>
          ) : (
            <span className="row-sub">出生信息没填完</span>
          )}
        </span>
        <span className="row-side">{count ? `${count} 次` : ''}</span>
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
          <strong>{chosen ? `给${chosen.name || '这位客人'}看什么` : '给谁测算'}</strong>
          <button type="button" className="link" onClick={chosen ? () => setChosen(null) : onClose}>{chosen ? '换一位' : '取消'}</button>
        </div>
        <div className="sheet-body">
          {chosen ? (
            <NewReadingButtons onCreate={(kind, year) => onCreate(chosen, kind, year)} />
          ) : (
            <>
              {clients.length > 6 && <input type="search" placeholder="搜称呼" value={query} onChange={(e) => setQuery(e.target.value)} />}
              <ul className="rows">
                {shown.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="row" onClick={() => setChosen(c)}>
                      <span className="row-title kai">{c.name || '未填称呼'}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn" onClick={onNewClient}>添加新客人</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
