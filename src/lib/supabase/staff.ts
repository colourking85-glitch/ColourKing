import { createClient } from './server';
import { admin } from './admin';

/**
 * The signed-in, active staff member for this request, or null.
 * API routes are not covered by the middleware auth redirect, so routes that
 * use the service-role client must call this first.
 */
export async function getStaffUser(): Promise<{ id: string; role: string } | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: staff } = await admin
    .from('staff')
    .select('id, role, active')
    .eq('id', user.id)
    .maybeSingle();

  if (!staff?.active) return null;
  return { id: staff.id, role: staff.role };
}
