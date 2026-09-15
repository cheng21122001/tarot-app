import { useState } from 'react';
import { cardImageUrl } from '../cards/deck';
import { formatDate, searchReadings } from '../reading/search';
import { isComplete, type Reading } from '../reading/types';
import './list.css';

export function ListPage({ readings, onOpen, onNew, onSignOut }: { readings: Reading[]; onOpen: (id: string) => void; onNew: () => void; onSignOut: () => void }) {
  const [query, setQuery] = useState('');
  const shown = searchReadings(readings, query);

  return (
    <div className="page">
      <header className="list-header">
        <h1>小艾塔罗</h1>
        <button type="button" className="text-btn" onClick={onSignOut}>退出</button>
      </header>
      <input type="search" placeholder="搜称呼或问题" value={query} onChange={(e) => setQuery(e.target.value)} />

      {shown.length === 0 && <p className="empty">{readings.length ? '没有匹配的记录' : '还没有测算记录'}</p>}

      <ul className="reading-list">
        {shown.map((r) => (
          <li key={r.id}>
            <button type="button" className="reading-item" onClick={() => onOpen(r.id)}>
              <div className="thumbs">
                {r.cards.map((c, i) =>
                  c ? <img key={i} src={cardImageUrl(c.id)} className={c.reversed ? 'reversed' : ''} alt="" /> : <span key={i} className="thumb-empty" />,
                )}
              </div>
              <div className="item-text">
                <div className="item-top">
                  <span className="item-name">{r.clientName || '未填称呼'}</span>
                  <span className="item-date">{formatDate(r.createdAt)}</span>
                </div>
                <div className="item-q">{r.question || '未填问题'}</div>
                {!isComplete(r) && <span className="badge">未完成</span>}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="fab" onClick={onNew} aria-label="新建测算">＋</button>
    </div>
  );
}
