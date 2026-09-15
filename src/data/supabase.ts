import { createClient } from '@supabase/supabase-js';

// anon key 是设计上公开的值，权限由 readings 表的 RLS 决定。
export const SUPABASE_URL = 'https://qsqcmsznxhuwjrjnihob.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcWNtc3pueGh1d2pyam5paG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNTQ5MzksImV4cCI6MjEwMTkzMDkzOX0.6fUOg60_IQeAZGzIquTVj_hJa6CcW6C2hWTSmzodUD4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'xiaoai-tarot-auth' },
});
