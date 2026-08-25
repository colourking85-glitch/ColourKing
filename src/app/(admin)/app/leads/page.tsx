'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Clock, MessageCircle, FileText, Trophy, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

type Lead = {
  id: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  kenteken: string | null;
  damage_description: string | null;
  status: string;
  origin: string;
  created_at: string;
};

export default function LeadsPage() {
  const t = useTranslations('ld');
  const tCommon = useTranslations('common');

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    new: { label: t('new_status'), color: 'text-blue-400 bg-blue-400/10', icon: Clock },
    contacted: { label: t('contacted'), color: 'text-amber-400 bg-amber-400/10', icon: MessageCircle },
    quoted: { label: t('quoted'), color: 'text-purple-400 bg-purple-400/10', icon: FileText },
    won: { label: t('won'), color: 'text-green-400 bg-green-400/10', icon: Trophy },
    lost: { label: t('lost'), color: 'text-red-400 bg-red-400/10', icon: XCircle },
  };

  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/leads?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setLeads)
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ScreenBadge code="LD05" />
          <h1 className="font-display text-2xl font-bold text-white">{t('title')}</h1>
        </div>
        <Link
          href="/app/leads/nieuw"
          className="flex items-center gap-2 rounded-lg bg-ck-red px-4 py-2 text-sm font-semibold text-white hover:bg-ck-red-hover"
        >
          <Plus size={16} />
          {t('new')}
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-muted" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card py-2 pl-10 pr-4 text-sm text-white placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-ck-dark-border bg-ck-dark-card p-1">
          <FilterBtn label={tCommon('all')} active={!statusFilter} onClick={() => setStatusFilter('')} />
          <FilterBtn label={t('new_status')} active={statusFilter === 'new'} onClick={() => setStatusFilter('new')} />
          <FilterBtn label={t('contacted')} active={statusFilter === 'contacted'} onClick={() => setStatusFilter('contacted')} />
          <FilterBtn label={t('quoted')} active={statusFilter === 'quoted'} onClick={() => setStatusFilter('quoted')} />
          <FilterBtn label={t('won')} active={statusFilter === 'won'} onClick={() => setStatusFilter('won')} />
          <FilterBtn label={t('lost')} active={statusFilter === 'lost'} onClick={() => setStatusFilter('lost')} />
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="p-8 text-center text-ck-muted">{tCommon('loading')}</div>
        ) : leads.length === 0 ? (
          <div className="rounded-lg border border-ck-dark-border bg-ck-dark-card p-8 text-center text-ck-muted">
            {search || statusFilter ? t('noLeadsFound') : t('noLeadsMessage')}
          </div>
        ) : (
          leads.map(lead => {
            const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
            const Icon = cfg.icon;
            return (
              <Link
                key={lead.id}
                href={`/app/leads/${lead.id}`}
                className="flex items-center justify-between rounded-lg border border-ck-dark-border bg-ck-dark-card p-4 hover:border-ck-muted/30"
              >
                <div className="flex items-center gap-4">
                  <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                    <Icon size={12} />
                    {cfg.label}
                  </span>
                  <div>
                    <p className="font-medium text-white">{lead.contact_name}</p>
                    <p className="text-xs text-ck-muted">
                      {[lead.kenteken, lead.contact_email, lead.contact_phone].filter(Boolean).join(' · ') || t('noContactInfo')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ck-muted">
                    {new Date(lead.created_at).toLocaleDateString('nl-NL')}
                  </p>
                  <p className="text-xs text-ck-muted">{lead.origin}</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
        active ? 'bg-ck-red text-white' : 'text-ck-muted hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
