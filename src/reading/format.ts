import type { Stamped } from '../data/merge';

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

// 列表已按创建时间倒序，这里按本地时间的年月切段，保持原顺序。
export function groupByMonth<T extends Stamped>(list: T[]): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  for (const r of list) {
    const d = new Date(r.createdAt);
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(r);
    else groups.push({ label, items: [r] });
  }
  return groups;
}
