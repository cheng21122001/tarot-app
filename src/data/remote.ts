import type { Reading } from '../reading/types';
import { fromRow, toRow, type ReadingRow } from './rows';
import { supabase } from './supabase';

const PAGE = 1000;

// Supabase 单次最多返回 1000 行，分页拉全。合并时会把远端没有的已同步记录当作被删除，所以必须拉全。
export async function fetchRemote(): Promise<Reading[]> {
  const all: Reading[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('readings')
      // 用 * 而不是列名：数据库还没加 birth 列时也能照常拉取。
      .select('*')
      .order('id')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...(data as ReadingRow[]).map(fromRow));
    if (data.length < PAGE) return all;
  }
}

export async function pushRemote(list: Reading[]): Promise<void> {
  if (!list.length) return;
  const { error } = await supabase.from('readings').upsert(list.map(toRow));
  if (!error) return;
  // 数据库还没加 birth 列时：没填出生信息的记录照常同步，填了的留在本地待同步，加列后自动推上去。
  if (/birth/.test(error.message)) {
    const plain = list.filter((r) => !r.birth).map((r) => {
      const { birth: _, ...row } = toRow(r);
      return row;
    });
    if (plain.length) await supabase.from('readings').upsert(plain);
  }
  throw error;
}

// 返回服务器上确认已不存在的 id。没有删除权限时 RLS 不报错、只是删 0 行，所以删完再查一遍。
export async function deleteRemote(ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const { error } = await supabase.from('readings').delete().in('id', ids);
  if (error) throw error;
  const { data, error: err } = await supabase.from('readings').select('id').in('id', ids);
  if (err) throw err;
  const left = new Set((data as { id: string }[]).map((r) => r.id));
  if (left.size) console.warn('delete not permitted for', [...left], '— run the delete policy in supabase/readings.sql');
  return ids.filter((id) => !left.has(id));
}
