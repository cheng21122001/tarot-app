import type { Doc } from '../domain/types';
import { DELETED, fromRow, LIVE_KINDS, toRow, type Row } from './rows';
import { supabase } from './supabase';

const PAGE = 1000;

// Supabase 单次最多返回 1000 行，分页拉全。合并时会把远端没有的已同步记录当作被删除，所以必须拉全。
export async function fetchRemote(): Promise<Doc[]> {
  const all: Doc[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('readings')
      .select('id,created_at,updated_at,client_name,question,spread_preset,positions,cards,interpretation,export_theme')
      .in('spread_preset', LIVE_KINDS)
      .order('id')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const row of data as Row[]) {
      const doc = fromRow(row);
      if (doc) all.push(doc);
    }
    if (data.length < PAGE) return all;
  }
}

export async function pushRemote(list: Doc[]): Promise<void> {
  if (!list.length) return;
  const { error } = await supabase.from('readings').upsert(list.map(toRow));
  if (error) throw error;
}

// 表没有删除权限，删除改为把记录清空并标成已删除；拉取时跳过，其他设备随之移除。
// 从没推上去过的记录不会被更新到，同样算删除成功。
export async function deleteRemote(ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const { error } = await supabase
    .from('readings')
    .update({
      spread_preset: DELETED,
      client_name: '',
      question: '',
      positions: ['', '', ''],
      cards: [null, null, null],
      interpretation: '',
      updated_at: new Date().toISOString(),
    })
    .in('id', ids);
  if (error) throw error;
  return ids;
}
