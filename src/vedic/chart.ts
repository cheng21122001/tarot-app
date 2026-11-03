import { birthSolar } from '../bazi/chart';
import type { BirthInfo } from '../domain/types';
import { ascendant, isValidTimeZone, localToUtc, planetPositions, siderealLon, type PlanetId } from './astro';

export type { PlanetId } from './astro';

export const SIGNS = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
export const SIGN_SA = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
export const PLANET_NAMES: Record<PlanetId, string> = {
  sun: '太阳', moon: '月亮', mars: '火星', mercury: '水星', jupiter: '木星', venus: '金星', saturn: '土星', rahu: '罗睺', ketu: '计都',
};
export const PLANET_SHORT: Record<PlanetId, string> = {
  sun: '日', moon: '月', mars: '火', mercury: '水', jupiter: '木', venus: '金', saturn: '土', rahu: '罗', ketu: '计',
};
const SIGN_LORD: PlanetId[] = ['mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter'];
const EXALT: Partial<Record<PlanetId, number>> = { sun: 0, moon: 1, mars: 9, mercury: 5, jupiter: 3, venus: 11, saturn: 6 };

// 二十七星宿：梵文名与对应的中国二十八宿（去牛宿）。
export const NAKSHATRAS: [string, string][] = [
  ['Ashwini', '娄'], ['Bharani', '胃'], ['Krittika', '昴'], ['Rohini', '毕'], ['Mrigashira', '觜'], ['Ardra', '参'],
  ['Punarvasu', '井'], ['Pushya', '鬼'], ['Ashlesha', '柳'], ['Magha', '星'], ['Purva Phalguni', '张'], ['Uttara Phalguni', '翼'],
  ['Hasta', '轸'], ['Chitra', '角'], ['Swati', '亢'], ['Vishakha', '氐'], ['Anuradha', '房'], ['Jyeshtha', '心'],
  ['Mula', '尾'], ['Purva Ashadha', '箕'], ['Uttara Ashadha', '斗'], ['Shravana', '女'], ['Dhanishta', '虚'], ['Shatabhisha', '危'],
  ['Purva Bhadrapada', '室'], ['Uttara Bhadrapada', '壁'], ['Revati', '奎'],
];
const NAK_SPAN = 360 / 27;

// 维姆肖塔里大运：九曜轮值，共 120 年。
const DASHA_ORDER: PlanetId[] = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'];
const DASHA_YEARS: Record<PlanetId, number> = { ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17 };
const YEAR_MS = 365.2425 * 86_400_000;

export type Dignity = '入旺' | '落陷' | '入庙' | '';

export interface Point {
  lon: number;
  sign: number; // 0 白羊 … 11 双鱼
  deg: number; // 星座内度数
  nak: number; // 0–26
  pada: number; // 1–4
}

export interface VPlanet extends Point {
  id: PlanetId;
  house: number; // 1–12，从上升（时辰不详时从月亮）起算的整宫制
  dignity: Dignity;
  retro: boolean;
  navamsa: number; // D9 星座
}

export interface Dasha {
  lord: PlanetId;
  start: Date;
  end: Date;
}

export interface TransitStep {
  sign: number;
  from: Date;
  to: Date;
  fromLagna: number | null;
  fromMoon: number;
}

export interface VedicChart {
  timeKnown: boolean;
  tz: string;
  birthYear: number;
  birthText: string;
  placeText: string;
  utcText: string;
  lagna: Point | null;
  houseBase: 'lagna' | 'moon';
  baseSign: number;
  planets: VPlanet[];
  moon: VPlanet;
  dashaBalance: string;
  mahadashas: Dasha[];
  year: number;
  refDate: Date;
  currentMd: Dasha | null;
  currentAd: Dasha | null;
  antardashas: Dasha[]; // 当前大运里的全部小运
  yearDashas: { md: Dasha; ad: Dasha }[]; // 与这一年有交集的小运
  transits: Record<'jupiter' | 'saturn' | 'rahu' | 'ketu', TransitStep[]>;
  solarMonths: { sign: number; start: Date }[];
}

const norm = (deg: number) => ((deg % 360) + 360) % 360;

function point(lon: number): Point {
  const nakPos = lon / NAK_SPAN;
  return { lon, sign: Math.floor(lon / 30), deg: lon % 30, nak: Math.floor(nakPos), pada: Math.floor((nakPos % 1) * 4) + 1 };
}

function dignity(id: PlanetId, sign: number): Dignity {
  const ex = EXALT[id];
  if (ex === undefined) return '';
  if (sign === ex) return '入旺';
  if (sign === (ex + 6) % 12) return '落陷';
  return SIGN_LORD[sign] === id ? '入庙' : '';
}

const houseOf = (sign: number, base: number) => ((sign - base + 12) % 12) + 1;

export function signLord(sign: number): PlanetId {
  return SIGN_LORD[sign];
}

function subPeriods(md: Dasha): Dasha[] {
  const total = md.end.getTime() - md.start.getTime();
  const i = DASHA_ORDER.indexOf(md.lord);
  let t = md.start.getTime();
  return Array.from({ length: 9 }, (_, k) => {
    const lord = DASHA_ORDER[(i + k) % 9];
    const len = (total * DASHA_YEARS[lord]) / 120;
    const d = { lord, start: new Date(t), end: new Date(t + len) };
    t += len;
    return d;
  });
}

function mahadashas(birth: Date, moonLon: number): { list: Dasha[]; balance: string } {
  const nak = Math.floor(moonLon / NAK_SPAN);
  const first = nak % 9;
  const elapsed = (moonLon % NAK_SPAN) / NAK_SPAN;
  const firstLord = DASHA_ORDER[first];
  let t = birth.getTime() - elapsed * DASHA_YEARS[firstLord] * YEAR_MS;
  const list = Array.from({ length: 10 }, (_, k) => {
    const lord = DASHA_ORDER[(first + k) % 9];
    const d = { lord, start: new Date(t), end: new Date(t + DASHA_YEARS[lord] * YEAR_MS) };
    t = d.end.getTime();
    return d;
  });
  const left = (1 - elapsed) * DASHA_YEARS[firstLord];
  const years = Math.floor(left);
  const months = Math.floor((left - years) * 12);
  return { list, balance: `出生时${PLANET_NAMES[firstLord]}大运还剩 ${years} 年 ${months} 个月` };
}

const within = (d: Dasha, at: Date) => d.start <= at && at < d.end;

const DAY = 86_400_000;
const signAt = (id: PlanetId, t: number) => Math.floor(siderealLon(id, new Date(t)) / 30);

// 一段时间内某颗星换座的时刻：先按 step 天粗扫，再二分到一小时以内。
// 木星、土星在换座处逆行来回的间隔都远大于 5 天，粗扫不会漏。
function ingresses(id: PlanetId, start: number, end: number, stepDays: number): { sign: number; at: number }[] {
  const out = [{ sign: signAt(id, start), at: start }];
  let prevT = start;
  let prev = out[0].sign;
  for (let t = Math.min(start + stepDays * DAY, end); ; t = Math.min(t + stepDays * DAY, end)) {
    const sign = signAt(id, t);
    if (sign !== prev) {
      let lo = prevT;
      let hi = t;
      while (hi - lo > 3_600_000) {
        const mid = (lo + hi) / 2;
        if (signAt(id, mid) === prev) lo = mid;
        else hi = mid;
      }
      out.push({ sign: signAt(id, hi), at: hi });
      prev = out[out.length - 1].sign;
      prevT = hi;
      t = hi;
      continue;
    }
    prevT = t;
    if (t >= end) return out;
  }
}

function transitSteps(id: 'jupiter' | 'saturn' | 'rahu' | 'ketu', year: number, base: number | null, moonSign: number): TransitStep[] {
  const end = Date.UTC(year + 1, 0, 1);
  const list = ingresses(id, Date.UTC(year, 0, 1), end, 5);
  return list.map((x, i) => ({
    sign: x.sign,
    from: new Date(x.at),
    to: new Date(i + 1 < list.length ? list[i + 1].at : Date.UTC(year, 11, 31, 12)),
    fromLagna: base === null ? null : houseOf(x.sign, base),
    fromMoon: houseOf(x.sign, moonSign),
  }));
}

// 太阳每进一个星座为一个太阳月（Sankranti），相当于八字的流月。
function solarMonths(year: number): { sign: number; start: Date }[] {
  return ingresses('sun', Date.UTC(year, 0, 1), Date.UTC(year + 1, 0, 1), 5)
    .slice(1)
    .map((x) => ({ sign: x.sign, start: new Date(x.at) }));
}

export function formatDeg(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}′`;
}

const pad = (n: number) => String(n).padStart(2, '0');

// 日期按出生地时区显示；没有出生地时用北京时间。
export function ymd(d: Date, tz = 'Asia/Shanghai'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function md(d: Date, tz = 'Asia/Shanghai'): string {
  const [, m, day] = ymd(d, tz).split('-');
  return `${Number(m)}/${Number(day)}`;
}

// 没有出生地或日期无效时返回 null。时辰不详按当地正午排，以月亮所在星座为第一宫（Chandra Lagna）。
export function buildVedicChart(b: BirthInfo, year: number, now: Date = new Date()): VedicChart | null {
  const place = b.place;
  const s = birthSolar(b);
  if (!place || !s || !isValidTimeZone(place.tz)) return null;
  const timeKnown = b.time !== null;
  const birth = localToUtc(s.y, s.m, s.d, timeKnown ? s.h : 12, timeKnown ? s.mi : 0, place.tz);

  const raw = planetPositions(birth);
  const moonLon = raw.find((p) => p.id === 'moon')!.lon;
  const lagna = timeKnown ? point(ascendant(birth, place.lat, place.lon)) : null;
  const baseSign = lagna ? lagna.sign : Math.floor(moonLon / 30);
  const planets: VPlanet[] = raw.map((p) => {
    const pt = point(p.lon);
    return { ...pt, id: p.id, house: houseOf(pt.sign, baseSign), dignity: dignity(p.id, pt.sign), retro: p.retro, navamsa: Math.floor((p.lon * 9) / 30) % 12 };
  });
  const moon = planets.find((p) => p.id === 'moon')!;

  const { list, balance } = mahadashas(birth, moonLon);
  const refDate = year === now.getFullYear() ? now : new Date(Date.UTC(year, 6, 1));
  const currentMd = list.find((d) => within(d, refDate)) ?? null;
  const antardashas = currentMd ? subPeriods(currentMd) : [];
  const currentAd = antardashas.find((d) => within(d, refDate)) ?? null;

  const yStart = new Date(Date.UTC(year, 0, 1));
  const yEnd = new Date(Date.UTC(year + 1, 0, 1));
  const yearDashas = list
    .filter((m) => m.start < yEnd && m.end > yStart)
    .flatMap((m) => subPeriods(m).filter((a) => a.start < yEnd && a.end > yStart).map((ad) => ({ md: m, ad })));

  const base = lagna ? lagna.sign : null;
  const tzOffsetText = (() => {
    const off = (Date.UTC(s.y, s.m - 1, s.d, timeKnown ? s.h : 12, timeKnown ? s.mi : 0) - birth.getTime()) / 3_600_000;
    return `UTC${off >= 0 ? '+' : ''}${Number.isInteger(off) ? off : off.toFixed(1)}`;
  })();

  return {
    timeKnown,
    tz: place.tz,
    birthYear: s.y,
    birthText: `${s.y}年${s.m}月${s.d}日${timeKnown ? ` ${pad(s.h)}:${pad(s.mi)}` : '（时辰不详，按正午）'}`,
    placeText: `${place.name}（${place.lat >= 0 ? '北纬' : '南纬'}${Math.abs(place.lat).toFixed(2)}°，${place.lon >= 0 ? '东经' : '西经'}${Math.abs(place.lon).toFixed(2)}°，${tzOffsetText}）`,
    utcText: birth.toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
    lagna,
    houseBase: lagna ? 'lagna' : 'moon',
    baseSign,
    planets,
    moon,
    dashaBalance: balance,
    mahadashas: list,
    year,
    refDate,
    currentMd,
    currentAd,
    antardashas,
    yearDashas,
    transits: {
      jupiter: transitSteps('jupiter', year, base, moon.sign),
      saturn: transitSteps('saturn', year, base, moon.sign),
      rahu: transitSteps('rahu', year, base, moon.sign),
      ketu: transitSteps('ketu', year, base, moon.sign),
    },
    solarMonths: solarMonths(year),
  };
}

export function nakText(p: Point): string {
  const [sa, zh] = NAKSHATRAS[p.nak];
  return `${sa}（${zh}宿）${p.pada}足`;
}

export function dashaText(d: Dasha, tz?: string): string {
  return `${PLANET_NAMES[d.lord]}（${ymd(d.start, tz)} 至 ${ymd(d.end, tz)}）`;
}

// 土星相对本命月亮的位置：第 12、1、2 宫为七年半（Sade Sati），第 4 宫为小考验，第 8 宫为八宫土星。
export function saturnFromMoon(house: number): string | null {
  if (house === 12) return '七年半（Sade Sati）第一阶段';
  if (house === 1) return '七年半（Sade Sati）第二阶段，最重';
  if (house === 2) return '七年半（Sade Sati）第三阶段';
  if (house === 4) return '第四宫土星（Kantaka Shani）';
  if (house === 8) return '第八宫土星（Ashtama Shani）';
  return null;
}
