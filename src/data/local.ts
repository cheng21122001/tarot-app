import { createStore, del, get, set } from 'idb-keyval';
import type { Reading } from '../reading/types';

const store = createStore('xiaoai-tarot', 'kv');
const K = { readings: 'readings', pending: 'pending', user: 'user' };

export async function loadLocal(): Promise<{ readings: Reading[]; pending: string[] }> {
  const [readings, pending] = await Promise.all([
    get<Record<string, Reading>>(K.readings, store),
    get<string[]>(K.pending, store),
  ]);
  return { readings: Object.values(readings ?? {}), pending: pending ?? [] };
}

let chain: Promise<void> = Promise.resolve();

export function writeLocal(readings: Reading[], pending: string[]): Promise<void> {
  chain = chain
    .then(async () => {
      await set(K.readings, Object.fromEntries(readings.map((r) => [r.id, r])), store);
      await set(K.pending, pending, store);
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
  }
  await set(K.user, userId, store);
}
