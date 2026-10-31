export type Theme = 'day' | 'night';

export interface BirthInfo {
  calendar: 'solar' | 'lunar';
  date: string; // YYYY-MM-DD，农历时为农历年月日
  leapMonth: boolean;
  time: string | null; // HH:mm，null 为时辰不详
  gender: 'male' | 'female';
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

export interface Reading {
  type: 'reading';
  id: string;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  clientName: string; // 建测算时的客人称呼，客人档案被删后列表仍能显示
  kind: ReadingKind;
  year: number; // 流年运势看的年份；命盘总论为建档当年，用来定当前大运流年
  focus: string; // 客人想重点看的方面，可空
  interpretation: string;
  exportTheme: Theme | null;
}

export type Doc = Client | Reading;

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

export function newReading(client: Client, kind: ReadingKind, year: number, now: Date = new Date()): Reading {
  const t = now.toISOString();
  return {
    type: 'reading',
    id: crypto.randomUUID(),
    createdAt: t,
    updatedAt: t,
    clientId: client.id,
    clientName: client.name,
    kind,
    year,
    focus: '',
    interpretation: '',
    exportTheme: null,
  };
}

export function readingTitle(r: Reading): string {
  return r.kind === 'year' ? `${r.year} 流年运势` : '命盘总论';
}

export function isClientBlank(c: Client): boolean {
  return !c.name.trim() && !c.birth.date.replace(/-/g, '') && !c.note.trim();
}
