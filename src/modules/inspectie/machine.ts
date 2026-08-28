export type InsStatus = 'CONCEPT' | 'BEZIG' | 'TER_AKKOORD' | 'AKKOORD' | 'VERGRENDELD' | 'GEANNULEERD';

type Transition = {
  from: InsStatus;
  to: InsStatus;
  guard?: string;
};

const TRANSITIONS: Transition[] = [
  { from: 'CONCEPT', to: 'BEZIG' },
  { from: 'BEZIG', to: 'TER_AKKOORD', guard: 'has_findings' },
  { from: 'TER_AKKOORD', to: 'AKKOORD', guard: 'has_inspector_approval' },
  // AKKOORD → VERGRENDELD is automatic (synchronous on approval)
  { from: 'CONCEPT', to: 'GEANNULEERD' },
  { from: 'BEZIG', to: 'GEANNULEERD' },
  { from: 'TER_AKKOORD', to: 'GEANNULEERD' },
  { from: 'TER_AKKOORD', to: 'BEZIG' },
];

const TERMINAL: InsStatus[] = ['VERGRENDELD', 'GEANNULEERD'];

export function canTransition(from: InsStatus, to: InsStatus): boolean {
  return TRANSITIONS.some(t => t.from === from && t.to === to);
}

export function getGuard(from: InsStatus, to: InsStatus): string | undefined {
  return TRANSITIONS.find(t => t.from === from && t.to === to)?.guard;
}

export function isTerminal(status: InsStatus): boolean {
  return TERMINAL.includes(status);
}

export function isEditable(status: InsStatus): boolean {
  return status === 'CONCEPT' || status === 'BEZIG';
}

export function allowedTransitions(from: InsStatus): InsStatus[] {
  return TRANSITIONS.filter(t => t.from === from).map(t => t.to);
}

export const STATUS_LABELS: Record<InsStatus, { nl: string; en: string; tr: string }> = {
  CONCEPT: { nl: 'Concept', en: 'Draft', tr: 'Taslak' },
  BEZIG: { nl: 'Bezig', en: 'In Progress', tr: 'Devam Ediyor' },
  TER_AKKOORD: { nl: 'Ter akkoord', en: 'Pending Approval', tr: 'Onay Bekliyor' },
  AKKOORD: { nl: 'Akkoord', en: 'Approved', tr: 'Onaylandı' },
  VERGRENDELD: { nl: 'Vergrendeld', en: 'Locked', tr: 'Kilitli' },
  GEANNULEERD: { nl: 'Geannuleerd', en: 'Cancelled', tr: 'İptal Edildi' },
};

export const STATUS_COLORS: Record<InsStatus, string> = {
  CONCEPT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  BEZIG: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  TER_AKKOORD: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  AKKOORD: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  VERGRENDELD: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  GEANNULEERD: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};
