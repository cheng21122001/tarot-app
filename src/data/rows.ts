import type { BirthInfo, CardPick, CardSlotsValue, Positions, Reading, SpreadPreset, Theme } from '../reading/types';

export interface ReadingRow {
  id: string;
  created_at: string;
  updated_at: string;
  client_name: string;
  question: string;
  spread_preset: string;
  positions: string[];
  // 前三项是三张牌；填了八字时第四项为 { birth }，旧版本只读前三项，不受影响。
  cards: (CardPick | { birth: BirthInfo } | null)[];
  interpretation: string;
  export_theme: Theme | null;
}

const PRESET_VALUES: SpreadPreset[] = ['past_present_future', 'situation_obstacle_advice', 'you_them_outcome', 'custom'];

export function toRow(r: Reading): ReadingRow {
  return {
    id: r.id,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    client_name: r.clientName,
    question: r.question,
    spread_preset: r.spreadPreset,
    positions: [...r.positions],
    cards: r.birth ? [...r.cards, { birth: r.birth }] : [...r.cards],
    interpretation: r.interpretation,
    export_theme: r.exportTheme,
  };
}

// Postgres 返回的时间形如 2026-09-15T10:00:00+00:00，统一成 toISOString 格式方便比较。
export function fromRow(row: ReadingRow): Reading {
  const positions = [0, 1, 2].map((i) => row.positions?.[i] ?? '') as Positions;
  const cards = [0, 1, 2].map((i) => row.cards?.[i] ?? null) as CardSlotsValue;
  const extra = row.cards?.[3];
  const preset = PRESET_VALUES.includes(row.spread_preset as SpreadPreset) ? (row.spread_preset as SpreadPreset) : 'custom';
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    clientName: row.client_name ?? '',
    question: row.question ?? '',
    spreadPreset: preset,
    positions,
    cards,
    interpretation: row.interpretation ?? '',
    exportTheme: row.export_theme === 'day' || row.export_theme === 'night' ? row.export_theme : null,
    birth: extra && 'birth' in extra ? normaliseBirth(extra.birth) : null,
  };
}

function normaliseBirth(b: unknown): BirthInfo | null {
  if (!b || typeof b !== 'object') return null;
  const o = b as Partial<BirthInfo>;
  if (typeof o.date !== 'string') return null;
  return {
    calendar: o.calendar === 'lunar' ? 'lunar' : 'solar',
    date: o.date,
    leapMonth: o.leapMonth === true,
    time: typeof o.time === 'string' ? o.time : null,
    gender: o.gender === 'female' ? 'female' : 'male',
  };
}
