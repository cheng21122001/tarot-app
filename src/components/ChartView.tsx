import { WU_XING_ORDER, type BaziChart } from '../bazi/chart';
import { Gz } from './Gz';
import './chart.css';

const WX_KEYS = ['wood', 'fire', 'earth', 'metal', 'water'];

// 专业排盘：四柱、五行分布、基本信息、大运；showYear 时加流年和十二流月。
export function ChartView({ chart: c, showYear = false }: { chart: BaziChart; showYear?: boolean }) {
  const total = WU_XING_ORDER.reduce((n, w) => n + c.wuXing[w], 0);
  return (
    <div className="chart">
      <div className="pillars" style={{ gridTemplateColumns: `2.6em repeat(${c.pillars.length}, 1fr)` }}>
        <span className="rl" />
        {c.pillars.map((p) => <span key={p.label} className="col-head">{p.label.slice(0, 1)}</span>)}
        <span className="rl">十神</span>
        {c.pillars.map((p) => <span key={p.label} className={`ss${p.ganShiShen === '日主' ? ' me' : ''}`}>{p.ganShiShen}</span>)}
        <span className="rl">天干</span>
        {c.pillars.map((p) => <Gz key={p.label} text={p.gan} className="glyph" />)}
        <span className="rl">地支</span>
        {c.pillars.map((p) => <Gz key={p.label} text={p.zhi} className="glyph" />)}
        <span className="rl">藏干</span>
        {c.pillars.map((p) => (
          <span key={p.label} className="hidden">
            {p.hidden.map((h) => (
              <span key={h.gan}>
                <Gz text={h.gan} />
                <small>{h.shiShen}</small>
              </span>
            ))}
          </span>
        ))}
        <span className="rl">纳音</span>
        {c.pillars.map((p) => <span key={p.label} className="minor">{p.naYin}</span>)}
        <span className="rl">星运</span>
        {c.pillars.map((p) => <span key={p.label} className="minor">{p.diShi}</span>)}
      </div>

      <div className="wx-bar" aria-label={`五行 ${WU_XING_ORDER.map((w) => w + c.wuXing[w]).join(' ')}`}>
        <div className="wx-track">
          {WU_XING_ORDER.map((w, i) => c.wuXing[w] > 0 && <span key={w} className={`bg-${WX_KEYS[i]}`} style={{ flexGrow: c.wuXing[w] / total }} />)}
        </div>
        <div className="wx-legend">
          {WU_XING_ORDER.map((w, i) => (
            <span key={w} className={c.wuXing[w] ? `wx-${WX_KEYS[i]}` : 'zero'}>
              {w}<b>{c.wuXing[w]}</b>
            </span>
          ))}
        </div>
      </div>

      <dl className="facts">
        <div><dt>日主</dt><dd><Gz text={c.dayMaster.slice(0, 1)} />{c.dayMaster.slice(1)}</dd></div>
        <div><dt>空亡</dt><dd><Gz text={c.kongWang} /></dd></div>
        <div><dt>胎元</dt><dd><Gz text={c.taiYuan} /></dd></div>
        {c.mingGong && <div><dt>命宫</dt><dd><Gz text={c.mingGong} /></dd></div>}
        <div><dt>起运</dt><dd>{c.startYun.replace('起运', '')}</dd></div>
      </dl>

      <h3 className="chart-h">大运</h3>
      <div className="dayun">
        {c.daYun.map((d) => (
          <div key={d.startYear} className={d === c.currentDaYun ? 'now' : ''}>
            <small>{d.shiShen}</small>
            <Gz text={d.ganZhi[0]} className="g" />
            <Gz text={d.ganZhi[1]} className="g" />
            <small>{d.startYear}</small>
            <small>{d.startAge}岁</small>
          </div>
        ))}
      </div>

      {showYear && (
        <>
          <h3 className="chart-h">
            {c.year} 年流年 <Gz text={c.liuNian.ganZhi} className="ln" /> <small>{c.liuNian.shiShen}</small>
          </h3>
          <div className="liuyue">
            {c.liuYue.map((m) => (
              <div key={m.ganZhi + m.start}>
                <Gz text={m.ganZhi} className="g" />
                <small>{m.jie} {m.start}</small>
                <small>{m.shiShen}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
