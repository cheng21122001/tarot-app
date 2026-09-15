import type { Reading } from '../reading/types';

const time = (r: Reading) => Date.parse(r.updatedAt);

export function sortByCreatedDesc(list: Reading[]): Reading[] {
  return [...list].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function mergeReadings(local: Reading[], remote: Reading[]): Reading[] {
  const byId = new Map<string, Reading>();
  for (const r of remote) byId.set(r.id, r);
  for (const l of local) {
    const rm = byId.get(l.id);
    if (!rm || time(l) > time(rm)) byId.set(l.id, l);
  }
  return sortByCreatedDesc([...byId.values()]);
}

export function idsToPush(local: Reading[], remote: Reading[], pending: string[]): string[] {
  const rmap = new Map(remote.map((r) => [r.id, r]));
  return local
    .filter((l) => {
      const rm = rmap.get(l.id);
      return pending.includes(l.id) || !rm || time(l) > time(rm);
    })
    .map((l) => l.id);
}
