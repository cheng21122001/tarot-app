import type { Reading } from './types';

export function searchReadings(list: Reading[], query: string): Reading[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((r) => r.clientName.toLowerCase().includes(q) || r.question.toLowerCase().includes(q));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}
