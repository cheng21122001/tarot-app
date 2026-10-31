export type SpreadPreset = 'past_present_future' | 'situation_obstacle_advice' | 'you_them_outcome' | 'custom';
export type Theme = 'day' | 'night';

export interface CardPick {
  id: string;
  reversed: boolean;
}

export type Positions = [string, string, string];
export type CardSlotsValue = [CardPick | null, CardPick | null, CardPick | null];

export interface BirthInfo {
  calendar: 'solar' | 'lunar';
  date: string; // YYYY-MM-DD，农历时为农历年月日
  leapMonth: boolean;
  time: string | null; // HH:mm，null 为时辰不详
  gender: 'male' | 'female';
}

export interface Reading {
  id: string;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  question: string;
  spreadPreset: SpreadPreset;
  positions: Positions;
  cards: CardSlotsValue;
  interpretation: string;
  exportTheme: Theme | null;
  birth: BirthInfo | null;
}

export const PRESETS: Record<Exclude<SpreadPreset, 'custom'>, Positions> = {
  past_present_future: ['过去', '现在', '未来'],
  situation_obstacle_advice: ['现状', '阻碍', '建议'],
  you_them_outcome: ['你', '对方', '关系走向'],
};

export function newReading(now: Date = new Date()): Reading {
  const t = now.toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: t,
    updatedAt: t,
    clientName: '',
    question: '',
    spreadPreset: 'past_present_future',
    positions: [...PRESETS.past_present_future],
    cards: [null, null, null],
    interpretation: '',
    exportTheme: null,
    birth: null,
  };
}

export function isBlank(r: Reading): boolean {
  return !r.clientName.trim() && !r.question.trim() && !r.interpretation.trim() && r.cards.every((c) => c === null);
}

export function isReadyForPrompt(r: Reading): boolean {
  return Boolean(r.question.trim()) && r.positions.every((p) => p.trim()) && r.cards.every((c) => c !== null);
}

export function isComplete(r: Reading): boolean {
  return Boolean(r.interpretation.trim());
}
