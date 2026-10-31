import { createStore, del, get, set } from 'idb-keyval';
import type { Reading } from '../reading/types';

const store = createStore('xiaoai-tarot', 'kv');
const K = { readings: 'readings', pending: 'pending', deleting: 'deleting', user: 'user' };

export interface LocalState {
  readings: Reading[];
  pending: string[];
  // 本机已删除、还没在服务器上确认删掉的记录 id。
  deleting: string[];
}

export async function loadLocal(): Promise<LocalState> {
  const [readings, pending, deleting] = await Promise.all([
    get<Record<string, Reading>>(K.readings, store),
    get<string[]>(K.pending, store),
    get<string[]>(K.deleting, store),
  ]);
  return { readings: Object.values(readings ?? {}), pending: pending ?? [], deleting: deleting ?? [] };
}

let chain: Promise<void> = Promise.resolve();

export function writeLocal(s: LocalState): Promise<void> {
  chain = chain
    .then(async () => {
      await set(K.readings, Object.fromEntries(s.readings.map((r) => [r.id, r])), store);
      await set(K.pending, s.pending, store);
      await set(K.deleting, s.deleting, store);
    })
    .catch((e) => console.error('writeLocal failed', e));
  return chain;
}

// 换了账号就清掉本地数据，同一账号重新登录保留（含未同步的）。
export async function claimLocalFor(userId: string): Promise<void> {
  const current = await get<string>(K.user, store);
  if (current && current !== userId) {
    await del(K.readings, store);
    await del(K.pending, store);
    await del(K.deleting, store);
  }
  await set(K.user, userId, store);
}
