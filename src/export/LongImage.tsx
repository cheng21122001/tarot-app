import { daYunText, WU_XING_ORDER, type BaziChart } from '../bazi/chart';
import { Gz } from '../components/Gz';
import { readingTitle, type Reading, type Theme } from '../domain/types';
import { NAKSHATRAS, PLANET_NAMES, SIGNS, type VedicChart } from '../vedic/chart';
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

function BaziHead({ c }: { c: BaziChart }) {
  return (
    <>
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
    </>
  );
}

function VedicHead({ c }: { c: VedicChart }) {
  const cols: [string, string][] = [
    [c.lagna ? '上升' : '第一宫（月亮）', SIGNS[c.baseSign]],
    ['月亮星座', SIGNS[c.moon.sign]],
    ['月宿', `${NAKSHATRAS[c.moon.nak][1]}宿`],
  ];
  return (
    <>
      <div className="li-pillars">
        {cols.map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <span className="li-g">{value}</span>
          </div>
        ))}
      </div>
      <div className="li-facts">
        {c.currentMd && <span>大运 {PLANET_NAMES[c.currentMd.lord]}</span>}
        {c.currentAd && <span>小运 {PLANET_NAMES[c.currentAd.lord]}</span>}
        <span>恒星黄道 · Lahiri</span>
      </div>
    </>
  );
}

export function LongImage({ reading: r, name, chart: c, vedic, parsed, theme, signature }: { reading: Reading; name: string; chart: BaziChart | null; vedic?: VedicChart | null; parsed: ParsedInterpretation; theme: Theme; signature: string }) {
  const seal = signature.trim();
  return (
    <div className={`li li-${theme}`}>
      <header className="li-top">
        <div className="li-name">{name} 的{vedic ? '吠陀星盘' : '八字'}</div>
        <div className="li-title">{readingTitle(r).replace(/^吠陀 /, '')}</div>
      </header>

      {vedic ? <VedicHead c={vedic} /> : c && <BaziHead c={c} />}

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
