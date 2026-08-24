export const JOB_STAGES = [
  'intake',
  'quoted',
  'approved',
  'scheduled',
  'checked_in',
  'in_progress',
  'qc',
  'ready',
  'delivered',
  'closed',
] as const;

export type JobStage = (typeof JOB_STAGES)[number];

export const STAGE_LABELS: Record<JobStage, string> = {
  intake: 'Intake',
  quoted: 'Offerte',
  approved: 'Goedgekeurd',
  scheduled: 'Ingepland',
  checked_in: 'Ingecheckt',
  in_progress: 'In Bewerking',
  qc: 'Kwaliteitscontrole',
  ready: 'Gereed',
  delivered: 'Afgeleverd',
  closed: 'Gesloten',
};

export const STAGE_COLORS: Record<JobStage, string> = {
  intake: 'text-slate-400 bg-slate-400/10',
  quoted: 'text-amber-400 bg-amber-400/10',
  approved: 'text-green-400 bg-green-400/10',
  scheduled: 'text-blue-400 bg-blue-400/10',
  checked_in: 'text-indigo-400 bg-indigo-400/10',
  in_progress: 'text-cyan-400 bg-cyan-400/10',
  qc: 'text-purple-400 bg-purple-400/10',
  ready: 'text-emerald-400 bg-emerald-400/10',
  delivered: 'text-teal-400 bg-teal-400/10',
  closed: 'text-gray-500 bg-gray-500/10',
};

const TRANSITIONS: Record<JobStage, JobStage[]> = {
  intake: ['quoted'],
  quoted: ['approved'],
  approved: ['scheduled'],
  scheduled: ['checked_in'],
  checked_in: ['in_progress'],
  in_progress: ['qc'],
  qc: ['ready', 'in_progress'],
  ready: ['delivered'],
  delivered: ['closed'],
  closed: [],
};

export function canTransition(from: JobStage, to: JobStage): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStages(current: JobStage): JobStage[] {
  return TRANSITIONS[current] ?? [];
}

export function stageIndex(stage: JobStage): number {
  return JOB_STAGES.indexOf(stage);
}
