import { useEffect, useState } from 'react';
import type { BirthPlace } from '../domain/types';
import { COMMON_TIMEZONES, searchCities, searchOnline } from '../vedic/cities';

const coordText = (p: BirthPlace) =>
  `${p.lat >= 0 ? '北纬' : '南纬'}${Math.abs(p.lat).toFixed(2)}° ${p.lon >= 0 ? '东经' : '西经'}${Math.abs(p.lon).toFixed(2)}°`;

// 出生地：先在内置城市里找，找不到再联网搜；都不行可以手填经纬度。
export function PlaceEditor({ place, onChange }: { place: BirthPlace | null | undefined; onChange: (p: BirthPlace | null) => void }) {
  const [editing, setEditing] = useState(!place);
  const [q, setQ] = useState('');
  const [online, setOnline] = useState<{ q: string; list: BirthPlace[] | null; error: boolean }>({ q: '', list: null, error: false });
  const [manual, setManual] = useState(false);
  const [m, setM] = useState({ name: '', lat: '', lon: '', tz: 'Asia/Shanghai' });

  const local = searchCities(q);
  const query = q.trim();

  useEffect(() => {
    if (query.length < 2 && !/[一-鿿]/.test(query)) return;
    const ctl = new AbortController();
    const timer = window.setTimeout(() => {
      searchOnline(query, ctl.signal)
        .then((list) => setOnline({ q: query, list, error: false }))
        .catch((e) => {
          if ((e as Error).name !== 'AbortError') setOnline({ q: query, list: null, error: true });
        });
    }, 450);
    return () => {
      ctl.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const pick = (p: BirthPlace) => {
    onChange(p);
    setEditing(false);
    setQ('');
    setManual(false);
  };

  if (!editing && place) {
    return (
      <div className="field">
        <span>出生地</span>
        <div className="place-show">
          <strong>{place.name || '手填坐标'}</strong>
          <small>{coordText(place)} · {place.tz}</small>
          <button type="button" className="link" onClick={() => setEditing(true)}>更改</button>
        </div>
      </div>
    );
  }

  const shownOnline = online.q === query ? online : null;
  const lat = Number(m.lat);
  const lon = Number(m.lon);
  const manualOk = m.lat.trim() !== '' && m.lon.trim() !== '' && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

  return (
    <div className="field place-edit">
      <span>出生地（吠陀占星排上升要用，八字用不到）</span>
      {!manual ? (
        <>
          <input type="search" placeholder="搜城市或县名，如 成都、绵竹、Singapore" value={q} onChange={(e) => setQ(e.target.value)} />
          {query && (
            <ul className="place-results">
              {local.map((p) => (
                <li key={`l-${p.name}`}>
                  <button type="button" onClick={() => pick(p)}>
                    <strong>{p.name}</strong>
                    <small>{coordText(p)}</small>
                  </button>
                </li>
              ))}
              {shownOnline?.list
                ?.filter((p) => !local.some((l) => l.name === p.name))
                .map((p) => (
                  <li key={`o-${p.name}-${p.lat}-${p.lon}`}>
                    <button type="button" onClick={() => pick(p)}>
                      <strong>{p.name}</strong>
                      <small>{coordText(p)}</small>
                    </button>
                  </li>
                ))}
            </ul>
          )}
          {query && shownOnline?.error && !local.length && <p className="hint">联网搜索没连上，可以搜附近的大城市，或手填经纬度。</p>}
          {query && shownOnline?.list?.length === 0 && !local.length && <p className="hint">没找到这个地方，换个写法试试，或手填经纬度。</p>}
          <div className="place-actions">
            <button type="button" className="link" onClick={() => setManual(true)}>手填经纬度</button>
            {place && <button type="button" className="link" onClick={() => setEditing(false)}>取消</button>}
          </div>
        </>
      ) : (
        <>
          <div className="place-manual">
            <input placeholder="地名（可不填）" value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} />
            <input inputMode="decimal" placeholder="纬度，如 30.57（南纬为负）" value={m.lat} onChange={(e) => setM({ ...m, lat: e.target.value })} />
            <input inputMode="decimal" placeholder="经度，如 104.07（西经为负）" value={m.lon} onChange={(e) => setM({ ...m, lon: e.target.value })} />
            <select value={m.tz} onChange={(e) => setM({ ...m, tz: e.target.value })} aria-label="时区">
              {COMMON_TIMEZONES.map(([tz, label]) => <option key={tz} value={tz}>{label}</option>)}
            </select>
          </div>
          <div className="place-actions">
            <button type="button" className="btn" disabled={!manualOk} onClick={() => pick({ name: m.name.trim(), lat, lon, tz: m.tz })}>用这个坐标</button>
            <button type="button" className="link" onClick={() => setManual(false)}>返回搜索</button>
          </div>
        </>
      )}
    </div>
  );
}
