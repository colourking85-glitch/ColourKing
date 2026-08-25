import { z } from 'zod';

const TASK_STATUSES = ['todo', 'in_progress', 'done', 'blocked'] as const;

export const TaskSchema = z.object({
  job_id: z.string().uuid(),
  offer_line_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  estimated_minutes: z.number().int().min(0).nullable().optional(),
  sort_order: z.number().int().default(0),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  estimated_minutes: z.number().int().min(0).nullable().optional(),
  sort_order: z.number().int().optional(),
});

export const TaskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
  blocked_reason: z.string().nullable().optional(),
});

export const TimeEntrySchema = z.object({
  staff_id: z.string().uuid(),
  job_id: z.string().uuid().nullable().optional(),
  task_id: z.string().uuid().nullable().optional(),
  clock_in: z.string().datetime(),
});

export const ClockOutSchema = z.object({
  clock_out: z.string().datetime(),
  break_minutes: z.number().int().min(0).default(0),
  notes: z.string().nullable().optional(),
});

export type TaskInput = z.infer<typeof TaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskStatusInput = z.infer<typeof TaskStatusSchema>;
export type TimeEntryInput = z.infer<typeof TimeEntrySchema>;
export type ClockOutInput = z.infer<typeof ClockOutSchema>;
