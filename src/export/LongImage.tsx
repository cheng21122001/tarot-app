import { wuXingText, daYunText, type BaziChart } from '../bazi/chart';
import { readingTitle, type Reading, type Theme } from '../domain/types';
import { formatDate } from '../reading/format';
import type { ParsedInterpretation } from '../reading/parse';
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

export function LongImage({ reading: r, name, chart: c, parsed, theme }: { reading: Reading; name: string; chart: BaziChart; parsed: ParsedInterpretation; theme: Theme }) {
  return (
    <div className={`li li-${theme}`}>
      <header className="li-top">
        <div className="li-kicker">八 字 命 理</div>
        <div className="li-title">{readingTitle(r)}</div>
        <div className="li-meta">{[name, c.genderText, formatDate(r.createdAt)].join(' · ')}</div>
        {r.focus.trim() && <div className="li-focus">「{r.focus.trim()}」</div>}
      </header>

      <div className="li-chart">
        <div className="li-pillars">
          {c.pillars.map((p) => (
            <div key={p.label}>
              <small>{p.label}</small>
              <small>{p.ganShiShen}</small>
              <strong>{p.gan}</strong>
              <strong>{p.zhi}</strong>
              <small>{p.hidden.map((h) => h.gan).join(' ')}</small>
              <small>{p.naYin}</small>
            </div>
          ))}
        </div>
        <div className="li-chart-meta">
          <div>日主 {c.dayMaster} · 五行 {wuXingText(c)}</div>
          {c.currentDaYun && <div>大运 {daYunText(c.currentDaYun)}</div>}
          <div>{r.kind === 'year' ? `${c.year} 流年` : '流年'} {c.liuNian.ganZhi}（{c.liuNian.shiShen}）</div>
        </div>
      </div>

      {parsed.kind === 'sections' ? (
        parsed.sections.map((s) => (
          <section className="li-sec" key={s.title}>
            <h4>{s.title}</h4>
            <Paragraphs text={s.body} />
          </section>
        ))
      ) : (
        <section className="li-sec">
          <Paragraphs text={parsed.text} />
        </section>
      )}

      <footer className="li-sign">— {SIGNATURE} —</footer>
    </div>
  );
}
