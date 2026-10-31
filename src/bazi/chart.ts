import { Lunar, Solar } from 'lunar-javascript';
import type { BirthInfo } from '../domain/types';

export type WuXing = '木' | '火' | '土' | '金' | '水';
const WU_XING: WuXing[] = ['木', '火', '土', '金', '水'];
const GANS = '甲乙丙丁戊己庚辛壬癸';
const SHI_SHEN = [
  ['比肩', '劫财'],
  ['食神', '伤官'],
  ['偏财', '正财'],
  ['七杀', '正官'],
  ['偏印', '正印'],
];

export function ganWuXing(gan: string): WuXing {
  return WU_XING[Math.floor(GANS.indexOf(gan) / 2)];
}

// 以日干为我，求另一天干的十神：同性为偏（比肩、食神、偏财、七杀、偏印），异性为正。
export function shiShen(dayGan: string, gan: string): string {
  const d = GANS.indexOf(dayGan);
  const o = GANS.indexOf(gan);
  const rel = (Math.floor(o / 2) - Math.floor(d / 2) + 5) % 5;
  return SHI_SHEN[rel][d % 2 === o % 2 ? 0 : 1];
}

export interface Pillar {
  label: '年柱' | '月柱' | '日柱' | '时柱';
  gan: string;
  zhi: string;
  ganShiShen: string;
  hidden: { gan: string; shiShen: string }[];
  naYin: string;
  diShi: string;
}

export interface Period {
  ganZhi: string;
  shiShen: string; // 天干十神
}

export interface DaYunStep extends Period {
  startYear: number;
  endYear: number;
  startAge: number; // 虚岁
}

export interface LiuYue extends Period {
  jie: string; // 起始节气
  start: string; // 节气日期 M/D
}

export interface BaziChart {
  solarText: string;
  lunarText: string;
  genderText: string;
  timeKnown: boolean;
  pillars: Pillar[];
  dayMaster: string; // 如「戊土」
  wuXing: Record<WuXing, number>;
  kongWang: string;
  mingGong: string | null;
  taiYuan: string;
  startYun: string;
  daYun: DaYunStep[];
  year: number;
  currentDaYun: DaYunStep | null;
  liuNian: Period;
  liuYue: LiuYue[];
}

function parseYmd(s: string): [number, number, number] | null {
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function toSolar(b: BirthInfo): Solar | null {
  const ymd = parseYmd(b.date);
  if (!ymd) return null;
  const [y, m, d] = ymd;
  if (y < 1900 || y > 2100) return null;
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

const period = (dayGan: string, ganZhi: string): Period => ({ ganZhi, shiShen: shiShen(dayGan, ganZhi[0]) });

// 流月以节为界：每个公历月 15 日一定已过当月的节，取那天的月干支和它之前的节。
function liuYueOf(dayGan: string, year: number): LiuYue[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 2;
    const lunar = Solar.fromYmd(month > 12 ? year + 1 : year, month > 12 ? 1 : month, 15).getLunar();
    const jie = lunar.getPrevJie();
    const s = jie.getSolar();
    return { ...period(dayGan, lunar.getMonthInGanZhiExact()), jie: jie.getName(), start: `${s.getMonth()}/${s.getDay()}` };
  });
}

// 时辰不详时按正午排出年月日三柱，时柱、命宫不展示也不交给解读。
export function buildChart(b: BirthInfo, year: number): BaziChart | null {
  const solar = toSolar(b);
  if (!solar) return null;
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  const timeKnown = b.time !== null;
  const dayGan = ec.getDayGan();

  const raw = [
    ['年柱', ec.getYear(), ec.getYearHideGan(), ec.getYearNaYin(), ec.getYearDiShi()],
    ['月柱', ec.getMonth(), ec.getMonthHideGan(), ec.getMonthNaYin(), ec.getMonthDiShi()],
    ['日柱', ec.getDay(), ec.getDayHideGan(), ec.getDayNaYin(), ec.getDayDiShi()],
    ['时柱', ec.getTime(), ec.getTimeHideGan(), ec.getTimeNaYin(), ec.getTimeDiShi()],
  ] as const;
  const pillars: Pillar[] = raw.slice(0, timeKnown ? 4 : 3).map(([label, gz, hidden, naYin, diShi]) => ({
    label,
    gan: gz[0],
    zhi: gz[1],
    ganShiShen: label === '日柱' ? '日主' : shiShen(dayGan, gz[0]),
    hidden: hidden.map((g) => ({ gan: g, shiShen: shiShen(dayGan, g) })),
    naYin,
    diShi,
  }));

  const wuXing = Object.fromEntries(WU_XING.map((w) => [w, 0])) as Record<WuXing, number>;
  const wx = [ec.getYearWuXing(), ec.getMonthWuXing(), ec.getDayWuXing(), ...(timeKnown ? [ec.getTimeWuXing()] : [])];
  for (const ch of wx.join('')) if (ch in wuXing) wuXing[ch as WuXing] += 1;

  const yun = ec.getYun(b.gender === 'male' ? 1 : 0);
  const daYun = yun
    .getDaYun()
    .filter((d) => d.getGanZhi())
    .slice(0, 10)
    .map((d) => ({ ...period(dayGan, d.getGanZhi()), startYear: d.getStartYear(), endYear: d.getEndYear(), startAge: d.getStartAge() }));
  const liuNianGz = Solar.fromYmd(year, 6, 1).getLunar().getYearInGanZhiExact();

  return {
    solarText: `公历 ${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日${timeKnown ? ` ${b.time}` : '（时辰不详）'}`,
    lunarText: `农历 ${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    genderText: b.gender === 'male' ? '男' : '女',
    timeKnown,
    pillars,
    dayMaster: `${dayGan}${ganWuXing(dayGan)}`,
    wuXing,
    kongWang: ec.getDayXunKong(),
    mingGong: timeKnown ? ec.getMingGong() : null,
    taiYuan: ec.getTaiYuan(),
    startYun: `${yun.getStartYear()}岁${yun.getStartMonth() ? `${yun.getStartMonth()}个月` : ''}起运`,
    daYun,
    year,
    currentDaYun: daYun.find((d) => d.startYear <= year && year <= d.endYear) ?? null,
    liuNian: period(dayGan, liuNianGz),
    liuYue: liuYueOf(dayGan, year),
  };
}

export function wuXingText(c: BaziChart): string {
  return WU_XING.map((w) => `${w}${c.wuXing[w]}`).join(' ');
}

export function pillarsText(c: BaziChart): string {
  return c.pillars.map((p) => p.gan + p.zhi).join(' ') + (c.timeKnown ? '' : '（时辰不详）');
}

export function daYunText(d: DaYunStep): string {
  return `${d.ganZhi}${d.shiShen}运（${d.startYear}–${d.endYear}，虚岁${d.startAge}起）`;
}

// 公历、农历互换，日期无效时只换历法标记，方便切换后重填。
export function switchCalendar(b: BirthInfo, to: BirthInfo['calendar']): BirthInfo {
  if (b.calendar === to) return b;
  const solar = toSolar(b);
  if (!solar) return { ...b, calendar: to, leapMonth: false };
  const p = (n: number) => String(n).padStart(2, '0');
  if (to === 'solar') return { ...b, calendar: 'solar', leapMonth: false, date: `${solar.getYear()}-${p(solar.getMonth())}-${p(solar.getDay())}` };
  const l = solar.getLunar();
  return { ...b, calendar: 'lunar', leapMonth: l.getMonth() < 0, date: `${l.getYear()}-${p(Math.abs(l.getMonth()))}-${p(l.getDay())}` };
}
