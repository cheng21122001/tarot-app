import { createStore, del, delMany, get, set } from 'idb-keyval';
import type { Doc } from '../domain/types';

const store = createStore('xiaoai-tarot', 'kv');
// 八字版换了一套键，塔罗版留下的本地数据不再读取，启动时顺手清掉。
const K = { docs: 'bazi-docs', pending: 'bazi-pending', deleting: 'bazi-deleting', user: 'user' };
const LEGACY = ['readings', 'pending', 'deleting'];

export interface LocalState {
  docs: Doc[];
  pending: string[];
  // 本机已删除、还没在服务器上确认删掉的记录 id。
  deleting: string[];
}

export async function loadLocal(): Promise<LocalState> {
  const [docs, pending, deleting] = await Promise.all([
    get<Record<string, Doc>>(K.docs, store),
    get<string[]>(K.pending, store),
    get<string[]>(K.deleting, store),
  ]);
  void delMany(LEGACY, store).catch(() => undefined);
  return { docs: Object.values(docs ?? {}), pending: pending ?? [], deleting: deleting ?? [] };
}

let chain: Promise<void> = Promise.resolve();

export function writeLocal(s: LocalState): Promise<void> {
  chain = chain
    .then(async () => {
      await set(K.docs, Object.fromEntries(s.docs.map((d) => [d.id, d])), store);
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
    await del(K.docs, store);
    await del(K.pending, store);
    await del(K.deleting, store);
  }
  await set(K.user, userId, store);
}
