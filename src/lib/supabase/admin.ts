import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;

export const admin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!_admin) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!url || !key) {
        throw new Error(
          'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
        );
      }

      _admin = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }

    return Reflect.get(_admin, prop, receiver);
  },
});
