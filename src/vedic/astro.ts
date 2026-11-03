import { Body, e_tilt, Ecliptic, EclipticGeoMoon, GeoVector, MakeTime, SiderealTime, SunPosition, type AstroTime } from 'astronomy-engine';

// 吠陀占星用的天文计算：恒星黄道（Lahiri 岁差）下的行星经度、上升点。
// 精度以 Swiss Ephemeris 为准核对过（见 astro.test.ts），误差在角分以内。

export type PlanetId = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn' | 'rahu' | 'ketu';
export const PLANETS: PlanetId[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

const BODY: Partial<Record<PlanetId, Body>> = {
  mars: Body.Mars,
  mercury: Body.Mercury,
  jupiter: Body.Jupiter,
  venus: Body.Venus,
  saturn: Body.Saturn,
};

const norm = (deg: number) => ((deg % 360) + 360) % 360;
const rad = (deg: number) => (deg * Math.PI) / 180;

// 儒略世纪数（TT，自 J2000 起）。
const centuries = (t: AstroTime) => t.tt / 36525;

// Lahiri（Chitrapaksha）岁差：J2000 时 23.857092°，之后按黄经总岁差累加。
export function lahiri(t: AstroTime): number {
  const T = centuries(t);
  return 23.857092 + (5028.796195 * T + 1.1054348 * T * T) / 3600;
}

// 回归黄道（当日真春分点）经度。
function tropical(p: PlanetId, t: AstroTime): number {
  if (p === 'sun') return SunPosition(t).elon;
  if (p === 'moon') return EclipticGeoMoon(t).lon;
  if (p === 'rahu' || p === 'ketu') {
    // 平均交点（Meeus 47.7），大多数吠陀软件的默认。
    const T = centuries(t);
    const node = 125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441;
    return norm(p === 'rahu' ? node : node + 180);
  }
  return Ecliptic(GeoVector(BODY[p]!, t, true)).elon;
}

export interface PlanetPos {
  id: PlanetId;
  lon: number; // 恒星黄道经度 0–360
  retro: boolean;
}

export function siderealLon(p: PlanetId, date: Date): number {
  const t = MakeTime(date);
  return norm(tropical(p, t) - lahiri(t));
}

export function planetPositions(date: Date): PlanetPos[] {
  const t = MakeTime(date);
  const aya = lahiri(t);
  const before = MakeTime(new Date(date.getTime() - 43_200_000));
  const after = MakeTime(new Date(date.getTime() + 43_200_000));
  return PLANETS.map((id) => {
    const lon = norm(tropical(id, t) - aya);
    let retro = id === 'rahu' || id === 'ketu';
    if (id !== 'sun' && id !== 'moon' && !retro) {
      const d = norm(tropical(id, after) - tropical(id, before) + 180) - 180;
      retro = d < 0;
    }
    return { id, lon, retro };
  });
}

// 上升点（恒星黄道）：地方恒星时 + 当地纬度。
export function ascendant(date: Date, lat: number, lon: number): number {
  const t = MakeTime(date);
  const ramc = rad(norm(SiderealTime(t) * 15 + lon));
  const eps = rad(e_tilt(t).tobl);
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(rad(lat)) * Math.sin(eps)));
  return norm((asc * 180) / Math.PI - lahiri(t));
}

// 某个时区在某一时刻相对 UTC 的偏移（分钟），含历史夏令时（例如中国 1986–1991 年）。
export function tzOffsetMinutes(tz: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

// 当地钟表时间 → UTC 时刻。
export function localToUtc(y: number, m: number, d: number, h: number, mi: number, tz: string): Date {
  const wall = Date.UTC(y, m - 1, d, h, mi);
  let utc = wall - tzOffsetMinutes(tz, new Date(wall)) * 60000;
  utc = wall - tzOffsetMinutes(tz, new Date(utc)) * 60000;
  return new Date(utc);
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
