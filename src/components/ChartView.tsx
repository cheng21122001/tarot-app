import { wuXingText, type BaziChart } from '../bazi/chart';
import './chart.css';

// 专业排盘：四柱表、基本信息、大运；showYear 时加流年和十二流月。
export function ChartView({ chart: c, showYear = false }: { chart: BaziChart; showYear?: boolean }) {
  return (
    <div className="chart">
      <table className="pillars">
        <thead>
          <tr>
            <th />
            {c.pillars.map((p) => <th key={p.label}>{p.label}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr className="muted">
            <th>十神</th>
            {c.pillars.map((p) => <td key={p.label}>{p.ganShiShen}</td>)}
          </tr>
          <tr className="big">
            <th>天干</th>
            {c.pillars.map((p) => <td key={p.label}>{p.gan}</td>)}
          </tr>
          <tr className="big">
            <th>地支</th>
            {c.pillars.map((p) => <td key={p.label}>{p.zhi}</td>)}
          </tr>
          <tr className="small">
            <th>藏干</th>
            {c.pillars.map((p) => (
              <td key={p.label}>
                {p.hidden.map((h) => (
                  <div key={h.gan}>
                    {h.gan}
                    <span>{h.shiShen}</span>
                  </div>
                ))}
              </td>
            ))}
          </tr>
          <tr className="small">
            <th>纳音</th>
            {c.pillars.map((p) => <td key={p.label}>{p.naYin}</td>)}
          </tr>
          <tr className="small">
            <th>星运</th>
            {c.pillars.map((p) => <td key={p.label}>{p.diShi}</td>)}
          </tr>
        </tbody>
      </table>

      <dl className="chart-info">
        <div><dt>日主</dt><dd>{c.dayMaster}</dd></div>
        <div><dt>五行</dt><dd>{wuXingText(c)}</dd></div>
        <div><dt>空亡</dt><dd>{c.kongWang}</dd></div>
        <div><dt>胎元</dt><dd>{c.taiYuan}</dd></div>
        {c.mingGong && <div><dt>命宫</dt><dd>{c.mingGong}</dd></div>}
        <div><dt>起运</dt><dd>{c.startYun}</dd></div>
      </dl>
      <p className="chart-birth">{c.solarText} · {c.lunarText} · {c.genderText}</p>

      <h3>大运</h3>
      <div className="dayun">
        {c.daYun.map((d) => (
          <div key={d.startYear} className={d === c.currentDaYun ? 'on' : ''}>
            <small>{d.shiShen}</small>
            <strong>{d.ganZhi}</strong>
            <small>{d.startYear}</small>
            <small>{d.startAge}岁</small>
          </div>
        ))}
      </div>

      {showYear && (
        <>
          <h3>
            {c.year} 流年 <strong>{c.liuNian.ganZhi}</strong> <small>{c.liuNian.shiShen}</small>
          </h3>
          <div className="liuyue">
            {c.liuYue.map((m) => (
              <div key={m.ganZhi + m.start}>
                <small>{m.jie} {m.start}</small>
                <strong>{m.ganZhi}</strong>
                <small>{m.shiShen}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
