import { cardImageUrl } from '../cards/deck';
import { cardDisplayName, ORDINALS } from '../reading/labels';
import type { ParsedInterpretation } from '../reading/parse';
import { formatDate } from '../reading/search';
import type { Reading, Theme } from '../reading/types';
import { SIGNATURE } from '../reading/wechat';
import './longImage.css';

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n+/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

export function LongImage({ reading: r, parsed, theme }: { reading: Reading; parsed: ParsedInterpretation; theme: Theme }) {
  return (
    <div className={`li li-${theme}`}>
      <header className="li-top">
        <div className="li-kicker">TAROT READING</div>
        <div className="li-q">{r.question.trim()}</div>
        <div className="li-meta">{[r.clientName.trim() || '客人', formatDate(r.createdAt), r.positions.join(' / ')].join(' · ')}</div>
        <div className="li-orn">✦ ✦ ✦</div>
      </header>

      <div className="li-cards">
        {([0, 1, 2] as const).map((i) => {
          const c = r.cards[i];
          return (
            <figure key={i}>
              {c && <img src={cardImageUrl(c.id)} className={c.reversed ? 'reversed' : ''} alt="" />}
              <figcaption>
                <div>{r.positions[i]}</div>
                <div>{cardDisplayName(c)}</div>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {parsed.kind === 'sections' ? (
        <>
          {([0, 1, 2] as const).map((i) => (
            <section className="li-sec" key={i}>
              <h4>
                {ORDINALS[i]} · {r.positions[i]} <span>{cardDisplayName(r.cards[i])}</span>
              </h4>
              <Paragraphs text={parsed.cards[i]} />
            </section>
          ))}
          <section className="li-sec">
            <h4>整体解读</h4>
            <Paragraphs text={parsed.overall} />
          </section>
          <section className="li-sec">
            <h4>建议</h4>
            <Paragraphs text={parsed.advice} />
          </section>
        </>
      ) : (
        <section className="li-sec">
          <Paragraphs text={parsed.text} />
        </section>
      )}

      <footer className="li-sign">— {SIGNATURE} —</footer>
    </div>
  );
}
