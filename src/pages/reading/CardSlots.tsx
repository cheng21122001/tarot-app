import { useState } from 'react';
import { cardImageUrl, getCard } from '../../cards/deck';
import type { CardPick, CardSlotsValue, Reading } from '../../reading/types';
import { CardPicker } from './CardPicker';

export function CardSlots({ reading: r, onChange }: { reading: Reading; onChange: (patch: Partial<Reading>) => void }) {
  const [picking, setPicking] = useState<number | null>(null);

  const setCard = (i: number, pick: CardPick | null) => {
    const cards = [...r.cards] as CardSlotsValue;
    cards[i] = pick;
    onChange({ cards });
  };

  return (
    <section className="section">
      <h2>牌面</h2>
      <div className="slots">
        {[0, 1, 2].map((i) => {
          const c = r.cards[i];
          return (
            <div className="slot" key={i}>
              <div className="slot-pos">{r.positions[i] || `位置${i + 1}`}</div>
              <button type="button" className="slot-card" onClick={() => setPicking(i)}>
                {c ? <img src={cardImageUrl(c.id)} className={c.reversed ? 'reversed' : ''} alt={getCard(c.id).nameZh} /> : <span className="slot-empty">选牌</span>}
              </button>
              {c && (
                <>
                  <div className="slot-name">{getCard(c.id).nameZh}</div>
                  <div className="chips orient">
                    <button type="button" className={`chip${!c.reversed ? ' on' : ''}`} onClick={() => setCard(i, { ...c, reversed: false })}>正位</button>
                    <button type="button" className={`chip${c.reversed ? ' on' : ''}`} onClick={() => setCard(i, { ...c, reversed: true })}>逆位</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {picking !== null && (
        <CardPicker
          exclude={r.cards.flatMap((c, idx) => (c && idx !== picking ? [c.id] : []))}
          onPick={(id) => {
            setCard(picking, { id, reversed: r.cards[picking]?.reversed ?? false });
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </section>
  );
}
