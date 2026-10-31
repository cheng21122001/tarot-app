import { getCard } from '../cards/deck';
import type { Reading } from './types';

export function searchReadings(list: Reading[], query: string): Reading[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (r) =>
      r.clientName.toLowerCase().includes(q) ||
      r.question.toLowerCase().includes(q) ||
      r.cards.some((c) => c !== null && getCard(c.id).nameZh.includes(q)),
  );
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

// 列表已按创建时间倒序，这里按本地时间的年月切段，保持原顺序。
export function groupByMonth(list: Reading[]): { label: string; items: Reading[] }[] {
  const groups: { label: string; items: Reading[] }[] = [];
  for (const r of list) {
    const d = new Date(r.createdAt);
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(r);
    else groups.push({ label, items: [r] });
  }
  return groups;
}
