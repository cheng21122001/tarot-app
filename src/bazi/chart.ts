import { Lunar, Solar } from 'lunar-javascript';
import type { BirthInfo } from '../reading/types';

export interface Pillar {
  label: '年柱' | '月柱' | '日柱' | '时柱';
  ganZhi: string;
  shiShen: string;
}

export interface DaYunStep {
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge: number;
}

export interface BaziChart {
  solarText: string;
  lunarText: string;
  timeKnown: boolean;
  pillars: Pillar[];
  dayMaster: string;
  wuXing: Record<WuXing, number>;
  startYun: string;
  daYun: DaYunStep[];
  currentDaYun: DaYunStep | null;
  liuNian: { year: number; ganZhi: string };
}

type WuXing = '金' | '木' | '水' | '火' | '土';
const WU_XING: WuXing[] = ['金', '木', '水', '火', '土'];
const GAN_WU_XING: Record<string, WuXing> = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };


function parseYmd(s: string): [number, number, number] | null {
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function toSolar(b: BirthInfo): Solar | null {
  const ymd = parseYmd(b.date);
  if (!ymd) return null;
  const [y, m, d] = ymd;
  const [h, mi] = b.time ? b.time.split(':').map(Number) : [12, 0];
  try {
    if (b.calendar === 'lunar') return Lunar.fromYmdHms(y, b.leapMonth ? -m : m, d, h, mi, 0).getSolar();
    // Solar 不校验日期，2 月 30 日也会照收，用 Date 检查一遍。
    const check = new Date(y, m - 1, d);
    if (check.getFullYear() !== y || check.getMonth() !== m - 1 || check.getDate() !== d) return null;
    return Solar.fromYmdHms(y, m, d, h, mi, 0);
  } catch {
    return null;
  }
}

// 时辰不详时按正午排出年月日三柱，时柱不展示也不交给解读。
export function buildChart(b: BirthInfo, at: Date): BaziChart | null {
  const solar = toSolar(b);
  if (!solar) return null;
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  const timeKnown = b.time !== null;

  const pillars: Pillar[] = [
    { label: '年柱', ganZhi: ec.getYear(), shiShen: ec.getYearShiShenGan() },
    { label: '月柱', ganZhi: ec.getMonth(), shiShen: ec.getMonthShiShenGan() },
    { label: '日柱', ganZhi: ec.getDay(), shiShen: '日主' },
  ];
  if (timeKnown) pillars.push({ label: '时柱', ganZhi: ec.getTime(), shiShen: ec.getTimeShiShenGan() });

  const wuXing = Object.fromEntries(WU_XING.map((w) => [w, 0])) as Record<WuXing, number>;
  const wx = [ec.getYearWuXing(), ec.getMonthWuXing(), ec.getDayWuXing(), ...(timeKnown ? [ec.getTimeWuXing()] : [])];
  for (const ch of wx.join('')) if (ch in wuXing) wuXing[ch as WuXing] += 1;

  const yun = ec.getYun(b.gender === 'male' ? 1 : 0);
  const daYun = yun
    .getDaYun()
    .filter((d) => d.getGanZhi())
    .slice(0, 8)
    .map((d) => ({ ganZhi: d.getGanZhi(), startYear: d.getStartYear(), endYear: d.getEndYear(), startAge: d.getStartAge() }));
  const year = at.getFullYear();

  return {
    solarText: `公历 ${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日${timeKnown ? ` ${b.time}` : ''}`,
    lunarText: `农历 ${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    timeKnown,
    pillars,
    dayMaster: `${ec.getDayGan()}${GAN_WU_XING[ec.getDayGan()]}`,
    wuXing,
    startYun: `${yun.getStartYear()}岁${yun.getStartMonth() ? `${yun.getStartMonth()}个月` : ''}起运`,
    daYun,
    currentDaYun: daYun.find((d) => d.startYear <= year && year <= d.endYear) ?? null,
    liuNian: { year, ganZhi: Solar.fromDate(at).getLunar().getYearInGanZhiExact() },
  };
}

export function wuXingText(c: BaziChart): string {
  return WU_XING.map((w) => `${w}${c.wuXing[w]}`).join(' ');
}

export function pillarsText(c: BaziChart): string {
  return c.pillars.map((p) => p.ganZhi).join(' ') + (c.timeKnown ? '' : '（时辰不详）');
}

export function daYunText(d: DaYunStep): string {
  return `${d.ganZhi}（${d.startYear}–${d.endYear}，虚岁${d.startAge}起）`;
}

// 公历、农历互换，日期无效时原样返回（只换历法标记），方便用户切换后重填。
export function switchCalendar(b: BirthInfo, to: BirthInfo['calendar']): BirthInfo {
  if (b.calendar === to) return b;
  const solar = toSolar(b);
  if (!solar) return { ...b, calendar: to, leapMonth: false };
  const p = (n: number) => String(n).padStart(2, '0');
  if (to === 'solar') return { ...b, calendar: 'solar', leapMonth: false, date: `${solar.getYear()}-${p(solar.getMonth())}-${p(solar.getDay())}` };
  const l = solar.getLunar();
  return { ...b, calendar: 'lunar', leapMonth: l.getMonth() < 0, date: `${l.getYear()}-${p(Math.abs(l.getMonth()))}-${p(l.getDay())}` };
}
