import { describe, it, expect } from 'vitest';
import {
  TaskSchema,
  UpdateTaskSchema,
  TaskStatusSchema,
  TimeEntrySchema,
  ClockOutSchema,
} from '../src/modules/tasks/schema';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('TaskSchema', () => {
  it('validates a minimal task', () => {
    const result = TaskSchema.safeParse({
      job_id: VALID_UUID,
      title: 'Spuiten bumper',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = TaskSchema.safeParse({
      job_id: VALID_UUID,
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing job_id', () => {
    const result = TaskSchema.safeParse({
      title: 'Some task',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid job_id', () => {
    const result = TaskSchema.safeParse({
      job_id: 'not-a-uuid',
      title: 'Some task',
    });
    expect(result.success).toBe(false);
  });

  it('defaults sort_order to 0', () => {
    const result = TaskSchema.parse({
      job_id: VALID_UUID,
      title: 'Test',
    });
    expect(result.sort_order).toBe(0);
  });

  it('accepts all optional fields', () => {
    const result = TaskSchema.safeParse({
      job_id: VALID_UUID,
      title: 'Full task',
      description: 'Some description',
      assigned_to: VALID_UUID,
      estimated_minutes: 120,
      offer_line_id: VALID_UUID,
      sort_order: 5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative estimated_minutes', () => {
    const result = TaskSchema.safeParse({
      job_id: VALID_UUID,
      title: 'Test',
      estimated_minutes: -10,
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateTaskSchema', () => {
  it('validates partial update', () => {
    const result = UpdateTaskSchema.safeParse({ title: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('validates empty update', () => {
    const result = UpdateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = UpdateTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });
});

describe('TaskStatusSchema', () => {
  it('accepts valid statuses', () => {
    for (const status of ['todo', 'in_progress', 'done', 'blocked']) {
      const result = TaskStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const result = TaskStatusSchema.safeParse({ status: 'cancelled' });
    expect(result.success).toBe(false);
  });

  it('accepts blocked_reason with blocked status', () => {
    const result = TaskStatusSchema.safeParse({
      status: 'blocked',
      blocked_reason: 'Waiting for parts',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null blocked_reason', () => {
    const result = TaskStatusSchema.safeParse({
      status: 'todo',
      blocked_reason: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('Task status transitions', () => {
  // Valid transitions: todo→in_progress, todo→blocked, in_progress→done, in_progress→blocked, blocked→todo
  const VALID_TRANSITIONS: Record<string, string[]> = {
    todo: ['in_progress', 'blocked'],
    in_progress: ['done', 'blocked'],
    done: [],
    blocked: ['todo'],
  };

  for (const [from, allowed] of Object.entries(VALID_TRANSITIONS)) {
    for (const to of allowed) {
      it(`allows ${from} → ${to}`, () => {
        expect(VALID_TRANSITIONS[from]).toContain(to);
      });
    }
  }

  it('does not allow done → in_progress', () => {
    expect(VALID_TRANSITIONS['done']).not.toContain('in_progress');
  });

  it('does not allow done → todo', () => {
    expect(VALID_TRANSITIONS['done']).not.toContain('todo');
  });

  it('does not allow blocked → in_progress', () => {
    expect(VALID_TRANSITIONS['blocked']).not.toContain('in_progress');
  });

  it('does not allow todo → done (must go through in_progress)', () => {
    expect(VALID_TRANSITIONS['todo']).not.toContain('done');
  });
});

describe('TimeEntrySchema', () => {
  it('validates a valid time entry', () => {
    const result = TimeEntrySchema.safeParse({
      staff_id: VALID_UUID,
      clock_in: '2026-08-25T08:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing staff_id', () => {
    const result = TimeEntrySchema.safeParse({
      clock_in: '2026-08-25T08:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing clock_in', () => {
    const result = TimeEntrySchema.safeParse({
      staff_id: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid datetime', () => {
    const result = TimeEntrySchema.safeParse({
      staff_id: VALID_UUID,
      clock_in: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional job_id and task_id', () => {
    const result = TimeEntrySchema.safeParse({
      staff_id: VALID_UUID,
      clock_in: '2026-08-25T08:00:00.000Z',
      job_id: VALID_UUID,
      task_id: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });
});

describe('ClockOutSchema', () => {
  it('validates a valid clock out', () => {
    const result = ClockOutSchema.safeParse({
      clock_out: '2026-08-25T17:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('defaults break_minutes to 0', () => {
    const result = ClockOutSchema.parse({
      clock_out: '2026-08-25T17:00:00.000Z',
    });
    expect(result.break_minutes).toBe(0);
  });

  it('accepts break_minutes and notes', () => {
    const result = ClockOutSchema.safeParse({
      clock_out: '2026-08-25T17:00:00.000Z',
      break_minutes: 30,
      notes: 'Finished front bumper',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative break_minutes', () => {
    const result = ClockOutSchema.safeParse({
      clock_out: '2026-08-25T17:00:00.000Z',
      break_minutes: -5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing clock_out', () => {
    const result = ClockOutSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
