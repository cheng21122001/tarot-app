import type { Reading } from '../reading/types';

const time = (r: Reading) => Date.parse(r.updatedAt);

export function sortByCreatedDesc(list: Reading[]): Reading[] {
  return [...list].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

// 本地有、远端没有、又不在待推送里的记录，说明已同步过、后来在别的设备上删掉了，跟着删。
// 本机正在删除的记录即使远端还在也不显示。
export function mergeReadings(local: Reading[], remote: Reading[], pending: string[] = [], deleting: string[] = []): Reading[] {
  const byId = new Map<string, Reading>();
  for (const r of remote) if (!deleting.includes(r.id)) byId.set(r.id, r);
  for (const l of local) {
    const rm = byId.get(l.id);
    if (rm ? time(l) > time(rm) : pending.includes(l.id)) byId.set(l.id, l);
  }
  return sortByCreatedDesc([...byId.values()]);
}

export function idsToPush(local: Reading[], remote: Reading[], pending: string[]): string[] {
  const rmap = new Map(remote.map((r) => [r.id, r]));
  return local
    .filter((l) => {
      const rm = rmap.get(l.id);
      return pending.includes(l.id) || (rm !== undefined && time(l) > time(rm));
    })
    .map((l) => l.id);
}
