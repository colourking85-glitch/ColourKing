import type { ReminderKind } from '@/types/database';
import type { EmailLocale } from '@/modules/email/schema';
import type { EmailPurpose } from '@/lib/email-identity';

export type { ReminderKind };

export type Candidate = {
  kind: ReminderKind;
  entityType: 'invoice' | 'offer' | 'appointment' | 'job';
  entityId: string;
  stage: string;
  recipient: string | null;
  locale: EmailLocale;
  sender: EmailPurpose;
  data: Record<string, unknown>;
};

export type CandidateResult = Candidate & {
  status: 'sent' | 'skipped' | 'failed';
  messageId?: string | null;
  error?: string | null;
};

export type RunReport = {
  ok: boolean;
  dryRun: boolean;
  today: string;
  evaluated: number;
  sent: number;
  skipped: number;
  failed: number;
  markedOverdue: number;
  results: CandidateResult[];
  error?: string;
};
