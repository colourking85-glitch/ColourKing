import { createClient } from '@/lib/supabase/server';
import type { AppointmentType, AppointmentStatus } from '@/types/database';

const APPOINTMENT_SELECT = `
  id, type, status, customer_id, vehicle_id, job_id, resource_id,
  contact_name, contact_phone, contact_email,
  scheduled_date, scheduled_time, duration_minutes,
  notes, confirmed_at, cancelled_at, cancel_reason, completed_at,
  created_by, created_at, updated_at,
  customers(id, name, email, phone),
  vehicles(id, kenteken, make, model),
  resources(id, type, name)
`;

export async function getAppointments(filters?: {
  type?: AppointmentType;
  status?: AppointmentStatus;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
}) {
  const supabase = createClient();
  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true });

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id);
  if (filters?.date_from) query = query.gte('scheduled_date', filters.date_from);
  if (filters?.date_to) query = query.lte('scheduled_date', filters.date_to);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getAppointment(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select(`${APPOINTMENT_SELECT}, staff:created_by(id, name)`)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getAppointmentsByDate(date: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('scheduled_date', date)
    .neq('status', 'cancelled')
    .order('scheduled_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getResources() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getOpeningHours() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('opening_hours')
    .select('*')
    .order('day_of_week', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getBlackouts(dateRange: { from: string; to: string }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('blackouts')
    .select('*')
    .lte('start_date', dateRange.to)
    .gte('end_date', dateRange.from)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAvailableSlots(date: string, type: AppointmentType) {
  const supabase = createClient();

  // Get day of week (0=Monday)
  const d = new Date(date + 'T00:00:00');
  const jsDay = d.getDay(); // 0=Sunday
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Monday

  // Get opening hours for this day
  const { data: hours } = await supabase
    .from('opening_hours')
    .select('*')
    .eq('day_of_week', dayOfWeek);

  if (!hours || hours.length === 0) return [];

  const openTime = hours[0].open_time;
  const closeTime = hours[0].close_time;

  // Check blackouts for this date
  const { data: blackouts } = await supabase
    .from('blackouts')
    .select('*')
    .lte('start_date', date)
    .gte('end_date', date);

  // If there's a global blackout (resource_id is null), no slots available
  if (blackouts?.some(b => !b.resource_id && b.all_day)) return [];

  // Get existing appointments for this date
  const { data: existing } = await supabase
    .from('appointments')
    .select('scheduled_time, duration_minutes, resource_id')
    .eq('scheduled_date', date)
    .neq('status', 'cancelled');

  // Get active resources
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .eq('active', true);

  // Default duration by type
  const defaultDuration = type === 'inspection' ? 30 : type === 'repair_slot' ? 60 : 30;

  // Generate 30-minute slots from open to close
  const slots: { time: string; available: boolean; resource_ids: string[] }[] = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  for (let m = openMinutes; m + defaultDuration <= closeMinutes; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

    // Check which resources are available at this time
    const availableResources = (resources ?? []).filter(r => {
      // Check resource-specific blackout
      if (blackouts?.some(b => b.resource_id === r.id)) return false;

      // Check if any existing appointment overlaps
      const overlaps = (existing ?? []).filter(a => {
        if (a.resource_id !== r.id) return false;
        const [aH, aM] = a.scheduled_time.split(':').map(Number);
        const aStart = aH * 60 + aM;
        const aEnd = aStart + a.duration_minutes;
        const slotEnd = m + defaultDuration;
        return m < aEnd && slotEnd > aStart;
      });
      return overlaps.length < r.capacity;
    });

    slots.push({
      time: timeStr,
      available: availableResources.length > 0,
      resource_ids: availableResources.map(r => r.id),
    });
  }

  return slots;
}
