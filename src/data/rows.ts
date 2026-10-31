import type { BirthInfo, Client, Doc, Reading, ReadingKind } from '../domain/types';

// 沿用原来的 readings 表，不改表结构：用 spread_preset 区分记录种类，其余内容放进 cards（jsonb）。
// 旧的塔罗记录 spread_preset 是牌阵名，不在下面几种里，拉取时直接跳过。
export const KIND = { client: 'bazi_client', natal: 'bazi_natal', year: 'bazi_year' } as const;
export const DELETED = 'deleted';
export const LIVE_KINDS: string[] = Object.values(KIND);

export interface Row {
  id: string;
  created_at: string;
  updated_at: string;
  client_name: string;
  question: string;
  spread_preset: string;
  positions: string[];
  cards: unknown;
  interpretation: string;
  export_theme: 'day' | 'night' | null;
}

export function toRow(d: Doc): Row {
  const common = { id: d.id, created_at: d.createdAt, updated_at: d.updatedAt, positions: ['', '', ''] };
  if (d.type === 'client') {
    return { ...common, spread_preset: KIND.client, client_name: d.name, question: d.note, cards: { birth: d.birth }, interpretation: '', export_theme: null };
  }
  return {
    ...common,
    spread_preset: KIND[d.kind],
    client_name: d.clientName,
    question: d.focus,
    cards: { clientId: d.clientId, year: d.year },
    interpretation: d.interpretation,
    export_theme: d.exportTheme,
  };
}

// Postgres 返回的时间形如 2026-09-15T10:00:00+00:00，统一成 toISOString 格式方便比较。
const iso = (s: string) => new Date(s).toISOString();

export function fromRow(row: Row): Doc | null {
  const data = (row.cards && typeof row.cards === 'object' && !Array.isArray(row.cards) ? row.cards : {}) as Record<string, unknown>;
  const common = { id: row.id, createdAt: iso(row.created_at), updatedAt: iso(row.updated_at) };
  if (row.spread_preset === KIND.client) {
    const birth = normaliseBirth(data.birth);
    if (!birth) return null;
    return { ...common, type: 'client', name: row.client_name ?? '', birth, note: row.question ?? '' } satisfies Client;
  }
  const kind = (Object.keys(KIND) as (keyof typeof KIND)[]).find((k) => k !== 'client' && KIND[k] === row.spread_preset) as ReadingKind | undefined;
  if (!kind || typeof data.clientId !== 'string') return null;
  return {
    ...common,
    type: 'reading',
    clientId: data.clientId,
    clientName: row.client_name ?? '',
    kind,
    year: typeof data.year === 'number' ? data.year : new Date(common.createdAt).getFullYear(),
    focus: row.question ?? '',
    interpretation: row.interpretation ?? '',
    exportTheme: row.export_theme === 'day' || row.export_theme === 'night' ? row.export_theme : null,
  } satisfies Reading;
}

function normaliseBirth(b: unknown): BirthInfo | null {
  if (!b || typeof b !== 'object') return null;
  const o = b as Partial<BirthInfo>;
  if (typeof o.date !== 'string') return null;
  return {
    calendar: o.calendar === 'lunar' ? 'lunar' : 'solar',
    date: o.date,
    leapMonth: o.leapMonth === true,
    time: typeof o.time === 'string' && o.time ? o.time : null,
    gender: o.gender === 'male' ? 'male' : 'female',
  };
}
