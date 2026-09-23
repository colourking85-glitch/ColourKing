import { NextResponse } from 'next/server';
import { getStaffUser } from '@/lib/supabase/staff';

type Staff = { id: string; role: string };

/**
 * Portfolio screens are for office + admin; converting a work order is a
 * manager decision and is admin-only. Returns the staff member or a response.
 */
export async function requirePortfolioStaff(adminOnly = false): Promise<Staff | NextResponse> {
  const staff = await getStaffUser();
  if (!staff) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const allowed = adminOnly ? staff.role === 'admin' : staff.role === 'admin' || staff.role === 'office';
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return staff;
}
