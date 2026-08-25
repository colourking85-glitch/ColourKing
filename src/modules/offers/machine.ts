import type { OfferStatus } from '@/types/database';

type Transition = {
  from: OfferStatus;
  to: OfferStatus;
  guard?: string;
};

const TRANSITIONS: Transition[] = [
  { from: 'draft', to: 'sent', guard: 'has_lines' },
  { from: 'sent', to: 'approved' },
  { from: 'sent', to: 'rejected' },
  { from: 'sent', to: 'superseded' },
];

const TERMINAL: OfferStatus[] = ['approved', 'rejected', 'superseded'];

export function canTransition(from: OfferStatus, to: OfferStatus): boolean {
  return TRANSITIONS.some(t => t.from === from && t.to === to);
}

export function getGuard(from: OfferStatus, to: OfferStatus): string | undefined {
  const t = TRANSITIONS.find(t => t.from === from && t.to === to);
  return t?.guard;
}

export function isTerminal(status: OfferStatus): boolean {
  return TERMINAL.includes(status);
}

export function allowedTransitions(from: OfferStatus): OfferStatus[] {
  return TRANSITIONS.filter(t => t.from === from).map(t => t.to);
}
