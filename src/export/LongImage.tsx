import { daYunText, WU_XING_ORDER, type BaziChart } from '../bazi/chart';
import { Gz } from '../components/Gz';
import { readingTitle, type Reading, type Theme } from '../domain/types';
import { formatDate } from '../reading/format';
import type { ParsedInterpretation } from '../reading/parse';
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

export function LongImage({ reading: r, name, chart: c, parsed, theme, signature }: { reading: Reading; name: string; chart: BaziChart; parsed: ParsedInterpretation; theme: Theme; signature: string }) {
  const seal = signature.trim();
  return (
    <div className={`li li-${theme}`}>
      <header className="li-top">
        <div className="li-name">{name} 的八字</div>
        <div className="li-title">{readingTitle(r)}</div>
      </header>

      <div className="li-pillars">
        {c.pillars.map((p) => (
          <div key={p.label}>
            <small>{p.label}</small>
            <small>{p.ganShiShen}</small>
            <Gz text={p.gan} className="li-g" />
            <Gz text={p.zhi} className="li-g" />
            <small>{p.naYin}</small>
          </div>
        ))}
      </div>
      <div className="li-facts">
        <span>日主 <Gz text={c.dayMaster.slice(0, 1)} />{c.dayMaster.slice(1)}</span>
        <span>五行 {WU_XING_ORDER.map((w) => `${w}${c.wuXing[w]}`).join(' ')}</span>
        {c.currentDaYun && <span>大运 {daYunText(c.currentDaYun).replace(/（.*/, '')}</span>}
        <span>{c.year} 流年 <Gz text={c.liuNian.ganZhi} /></span>
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

      <footer className="li-sign">
        <span className="li-date">{formatDate(r.createdAt)}</span>
        {seal && (
          // 印章竖排：两三个字排一列；四个字排两列，从右列读起。
          <span className={`li-seal${seal.length === 4 ? ' four' : seal.length === 3 ? ' three' : ''}`}>
            {(seal.length === 4 ? seal.slice(2) + seal.slice(0, 2) : seal.slice(0, 4)).split('').map((ch, i) => <span key={i}>{ch}</span>)}
          </span>
        )}
      </footer>
    </div>
  );
}
