import { describe, it, expect } from 'vitest';
import {
  canTransition,
  nextStages,
  stageIndex,
  JOB_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
} from '../src/modules/jobs/machine';

describe('Job state machine', () => {
  it('allows valid forward transitions', () => {
    expect(canTransition('intake', 'quoted')).toBe(true);
    expect(canTransition('quoted', 'approved')).toBe(true);
    expect(canTransition('approved', 'scheduled')).toBe(true);
    expect(canTransition('scheduled', 'checked_in')).toBe(true);
    expect(canTransition('checked_in', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'qc')).toBe(true);
    expect(canTransition('qc', 'ready')).toBe(true);
    expect(canTransition('ready', 'delivered')).toBe(true);
    expect(canTransition('delivered', 'closed')).toBe(true);
  });

  it('allows qc to go back to in_progress', () => {
    expect(canTransition('qc', 'in_progress')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('intake', 'closed')).toBe(false);
    expect(canTransition('intake', 'in_progress')).toBe(false);
    expect(canTransition('closed', 'intake')).toBe(false);
    expect(canTransition('ready', 'intake')).toBe(false);
    expect(canTransition('delivered', 'qc')).toBe(false);
  });

  it('closed has no next stages', () => {
    expect(nextStages('closed')).toEqual([]);
  });

  it('qc has two next stages', () => {
    const next = nextStages('qc');
    expect(next).toContain('ready');
    expect(next).toContain('in_progress');
    expect(next).toHaveLength(2);
  });

  it('stageIndex returns correct positions', () => {
    expect(stageIndex('intake')).toBe(0);
    expect(stageIndex('closed')).toBe(9);
  });

  it('every stage has a label and color', () => {
    for (const stage of JOB_STAGES) {
      expect(STAGE_LABELS[stage]).toBeTruthy();
      expect(STAGE_COLORS[stage]).toBeTruthy();
    }
  });
});
