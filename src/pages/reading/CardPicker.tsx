import { useState } from 'react';
import { cardImageUrl, DECK, GROUP_LABELS, searchCards, type CardGroup } from '../../cards/deck';

export function CardPicker({ exclude, onPick, onClose }: { exclude: string[]; onPick: (id: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const results = query.trim() ? searchCards(query) : DECK;
  const groups = (Object.keys(GROUP_LABELS) as CardGroup[])
    .map((g) => ({ g, cards: results.filter((c) => c.group === g) }))
    .filter((x) => x.cards.length);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal picker" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <input type="search" placeholder="搜牌名，如 塔、宝剑三" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button type="button" className="text-btn" onClick={onClose}>取消</button>
        </div>
        <div className="picker-body">
          {groups.map(({ g, cards }) => (
            <div key={g}>
              <h3>{GROUP_LABELS[g]}</h3>
              <div className="picker-grid">
                {cards.map((c) => (
                  <button type="button" key={c.id} disabled={exclude.includes(c.id)} onClick={() => onPick(c.id)}>
                    <img src={cardImageUrl(c.id)} alt="" loading="lazy" />
                    <span>{c.nameZh}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {groups.length === 0 && <p className="empty">没有找到这张牌</p>}
        </div>
      </div>
    </div>
  );
}
