import type { Reading } from '../reading/types';
import { fromRow, toRow, type ReadingRow } from './rows';
import { supabase } from './supabase';

export async function fetchRemote(): Promise<Reading[]> {
  const { data, error } = await supabase
    .from('readings')
    .select('id,created_at,updated_at,client_name,question,spread_preset,positions,cards,interpretation,export_theme');
  if (error) throw error;
  return (data as ReadingRow[]).map(fromRow);
}

export async function pushRemote(list: Reading[]): Promise<void> {
  if (!list.length) return;
  const { error } = await supabase.from('readings').upsert(list.map(toRow));
  if (error) throw error;
}
