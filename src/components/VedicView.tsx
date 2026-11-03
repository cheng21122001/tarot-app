import { dashaText, formatDeg, md, NAKSHATRAS, PLANET_NAMES, PLANET_SHORT, saturnFromMoon, SIGNS, ymd, type VedicChart } from '../vedic/chart';
import './vedic.css';

// 南印度式星盘：十二星座位置固定，绕成一圈；上升所在格标「升」。
const CELL: [number, number][] = [
  [1, 2], [1, 3], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3], [4, 2], [4, 1], [3, 1], [2, 1], [1, 1],
];

export function VedicView({ chart: c, showYear = false }: { chart: VedicChart; showYear?: boolean }) {
  return (
    <div className="chart vedic">
      <div className="si-chart">
        {SIGNS.map((name, s) => {
          const [row, col] = CELL[s];
          const here = c.planets.filter((p) => p.sign === s);
          const house = ((s - c.baseSign + 12) % 12) + 1;
          return (
            <div key={s} className={`si-cell${c.lagna?.sign === s ? ' asc' : ''}`} style={{ gridRow: row, gridColumn: col }}>
              <span className="si-sign">{name}<small>{house}</small></span>
              <span className="si-planets">
                {c.lagna?.sign === s && <b className="si-asc">升</b>}
                {here.map((p) => (
                  <span key={p.id} className={p.dignity === '入旺' ? 'up' : p.dignity === '落陷' ? 'down' : ''}>
                    {PLANET_SHORT[p.id]}
                    {p.retro && p.id !== 'rahu' && p.id !== 'ketu' && <sup>R</sup>}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
        <div className="si-center">
          <strong>{c.lagna ? `${SIGNS[c.lagna.sign]}上升` : '月亮为第一宫'}</strong>
          <span>月亮 {SIGNS[c.moon.sign]} · {NAKSHATRAS[c.moon.nak][1]}宿</span>
          <small>恒星黄道 · Lahiri</small>
        </div>
      </div>
      {!c.timeKnown && <p className="hint">时辰不详：没有上升，宫位从月亮所在星座数起。</p>}

      <table className="v-table">
        <thead>
          <tr><th>星</th><th>星座</th><th>宫</th><th>星宿</th><th /></tr>
        </thead>
        <tbody>
          {c.lagna && (
            <tr className="asc-row">
              <td>上升</td>
              <td>{SIGNS[c.lagna.sign]} <small>{formatDeg(c.lagna.deg)}</small></td>
              <td>1</td>
              <td>{NAKSHATRAS[c.lagna.nak][1]}<small>{c.lagna.pada}</small></td>
              <td />
            </tr>
          )}
          {c.planets.map((p) => (
            <tr key={p.id}>
              <td>{PLANET_NAMES[p.id]}</td>
              <td>{SIGNS[p.sign]} <small>{formatDeg(p.deg)}</small></td>
              <td>{p.house}</td>
              <td>{NAKSHATRAS[p.nak][1]}<small>{p.pada}</small></td>
              <td className="tags">
                {p.dignity && <em className={p.dignity === '落陷' ? 'down' : 'up'}>{p.dignity}</em>}
                {p.retro && p.id !== 'rahu' && p.id !== 'ketu' && <em>逆行</em>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="chart-h">大运 <small>{c.dashaBalance}</small></h3>
      <div className="dayun" data-hscroll>
        {c.mahadashas.map((d) => (
          <div key={d.start.getTime()} className={d === c.currentMd ? 'now' : ''}>
            <span className="g">{PLANET_SHORT[d.lord]}</span>
            <small>{ymd(d.start, c.tz).slice(0, 4)}</small>
            <small>{Math.max(0, Number(ymd(d.start, c.tz).slice(0, 4)) - c.birthYear)}岁</small>
          </div>
        ))}
      </div>

      {!showYear && c.currentMd && (
        <>
          <h3 className="chart-h">{PLANET_NAMES[c.currentMd.lord]}大运里的小运</h3>
          <ul className="v-list">
            {c.antardashas.map((d) => (
              <li key={d.start.getTime()} className={d === c.currentAd ? 'now' : ''}>
                <span>{PLANET_NAMES[d.lord]}</span>
                <small>{ymd(d.start, c.tz)} 起</small>
              </li>
            ))}
          </ul>
        </>
      )}

      {showYear && (
        <>
          <h3 className="chart-h">{c.year} 年的大运小运</h3>
          <ul className="v-list">
            {c.yearDashas.map((x) => (
              <li key={x.ad.start.getTime()}>
                <span>{PLANET_NAMES[x.md.lord]} / {PLANET_NAMES[x.ad.lord]}</span>
                <small>{dashaText(x.ad, c.tz).replace(/^.*?（/, '').replace('）', '')}</small>
              </li>
            ))}
          </ul>

          <h3 className="chart-h">慢星行运 <small>宫位：从上升 / 从月亮</small></h3>
          <ul className="v-list">
            {(['jupiter', 'saturn', 'rahu', 'ketu'] as const).flatMap((id) =>
              c.transits[id].map((s) => {
                const sat = id === 'saturn' ? saturnFromMoon(s.fromMoon) : null;
                return (
                  <li key={id + s.from.getTime()}>
                    <span>{PLANET_NAMES[id]} {SIGNS[s.sign]}</span>
                    <small>
                      {md(s.from, c.tz)}–{md(s.to, c.tz)} · {s.fromLagna ?? '—'} / {s.fromMoon} 宫{sat ? ` · ${sat.replace(/（.*）/, '')}` : ''}
                    </small>
                  </li>
                );
              }),
            )}
          </ul>

          <h3 className="chart-h">太阳月</h3>
          <div className="liuyue">
            {c.solarMonths.map((m) => (
              <div key={m.start.getTime()}>
                <span className="g">{SIGNS[m.sign]}</span>
                <small>{md(m.start, c.tz)} 起</small>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
