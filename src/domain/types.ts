export type Theme = 'day' | 'night';

export interface BirthInfo {
  calendar: 'solar' | 'lunar';
  date: string; // YYYY-MM-DD，农历时为农历年月日
  leapMonth: boolean;
  time: string | null; // HH:mm，null 为时辰不详
  gender: 'male' | 'female';
  place?: BirthPlace | null; // 出生地，吠陀星盘排上升和宫位要用；八字不用
}

export interface BirthPlace {
  name: string;
  lat: number; // 北纬为正
  lon: number; // 东经为正
  tz: string; // IANA 时区名，如 Asia/Shanghai，用来把出生钟表时间换成 UTC（含历史夏令时）
}

export interface Client {
  type: 'client';
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  birth: BirthInfo;
  note: string;
}

export type ReadingKind = 'natal' | 'year';

// 用哪套命理：八字，或吠陀占星（印度占星，Jyotish）。
export type System = 'bazi' | 'vedic';
export const SYSTEM_LABELS: Record<System, string> = { bazi: '八字', vedic: '吠陀占星' };

// 取用神的流派。格局偏看成就与方向，调候偏看心态与状态，扶抑看日主强弱与承受力。
export type School = 'geju' | 'tiaohou' | 'fuyi';
export const SCHOOLS: School[] = ['geju', 'tiaohou', 'fuyi'];
export const SCHOOL_LABELS: Record<School, string> = { geju: '格局派', tiaohou: '调候派', fuyi: '扶抑派' };
export const SCHOOL_HINTS: Record<School, string> = { geju: '看成就与方向', tiaohou: '看心态与状态', fuyi: '看强弱与喜忌' };

export interface Reading {
  type: 'reading';
  id: string;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  clientName: string; // 建测算时命主的称呼，命主被删后列表仍能显示
  system: System; // 加入吠陀之前的旧记录都是八字
  kind: ReadingKind;
  year: number; // 流年运势看的年份；命盘总论为建档当年，用来定当前大运流年
  focus: string; // 已不在界面上填写，保留字段以兼容旧记录
  schools: School[]; // 空数组为加入流派之前的旧测算，按旧的分段写法
  interpretation: string;
  exportTheme: Theme | null;
}

// 每个账号一份的设置，跟着账号在各设备同步。
export interface Settings {
  type: 'settings';
  id: string;
  createdAt: string;
  updatedAt: string;
  signature: string; // 长图落款印章和微信文字末尾的署名，空则不加
}

export type Doc = Client | Reading | Settings;

export function newSettings(now: Date = new Date()): Settings {
  const t = now.toISOString();
  return { type: 'settings', id: crypto.randomUUID(), createdAt: t, updatedAt: t, signature: '' };
}

export const KIND_LABELS: Record<ReadingKind, string> = { natal: '命盘总论', year: '流年运势' };

export function newClient(now: Date = new Date()): Client {
  const t = now.toISOString();
  return {
    type: 'client',
    id: crypto.randomUUID(),
    createdAt: t,
    updatedAt: t,
    name: '',
    birth: { calendar: 'solar', date: '', leapMonth: false, time: null, gender: 'female' },
    note: '',
  };
}

export function newReading(client: Client, kind: ReadingKind, year: number, now: Date = new Date(), system: System = 'bazi'): Reading {
  const t = now.toISOString();
  return {
    type: 'reading',
    id: crypto.randomUUID(),
    createdAt: t,
    updatedAt: t,
    clientId: client.id,
    clientName: client.name,
    system,
    kind,
    year,
    focus: '',
    schools: system === 'bazi' ? ['geju', 'tiaohou'] : [],
    interpretation: '',
    exportTheme: null,
  };
}

export function readingTitle(r: Reading): string {
  const title = r.kind === 'year' ? `${r.year} 流年运势` : '命盘总论';
  return r.system === 'vedic' ? `吠陀 ${title}` : title;
}

export function isClientBlank(c: Client): boolean {
  return !c.name.trim() && !c.birth.date.replace(/-/g, '') && !c.note.trim();
}
