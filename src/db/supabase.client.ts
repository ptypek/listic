import { createClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export type SupabaseClient = typeof supabaseClient;

export const createSupabaseServerInstance = (context: {
  cookies: AstroCookies;
  request: Request;
}) => {
  const supabase = createServerClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(key: string) {
          return context.cookies.get(key)?.value;
        },
        set(key: string, value: string, options: CookieOptionsWithName) {
          context.cookies.set(key, value, options);
        },
        remove(key: string, options: CookieOptionsWithName) {
          context.cookies.delete(key, options);
        },
      },
    },
  );

  return supabase;
};
