import type { InvoiceStatus } from '@/types/database';

type Transition = {
  from: InvoiceStatus;
  to: InvoiceStatus;
  guard?: string;
};

const TRANSITIONS: Transition[] = [
  { from: 'draft', to: 'sent', guard: 'has_lines' },
  { from: 'sent', to: 'paid' },
  { from: 'sent', to: 'overdue' },
  { from: 'sent', to: 'credited' },
  { from: 'draft', to: 'cancelled' }, // only drafts can be deleted/cancelled
];

const TERMINAL: InvoiceStatus[] = ['paid', 'cancelled', 'credited'];

export function canTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return TRANSITIONS.some(t => t.from === from && t.to === to);
}

export function getGuard(from: InvoiceStatus, to: InvoiceStatus): string | undefined {
  const t = TRANSITIONS.find(t => t.from === from && t.to === to);
  return t?.guard;
}

export function isTerminal(status: InvoiceStatus): boolean {
  return TERMINAL.includes(status);
}

export function allowedTransitions(from: InvoiceStatus): InvoiceStatus[] {
  return TRANSITIONS.filter(t => t.from === from).map(t => t.to);
}
