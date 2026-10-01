'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpenCheck, Bot, ChevronRight, ChevronDown, GitBranch, Globe, Search } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { BusinessFlowChart } from '@/components/ui/BusinessFlowChart';
import { SCREEN_REGISTRY } from '@/lib/codes';
import { MODULES, type ScreenDoc, type ModuleDoc, loadLocaleModules, getModulesForLocale } from '@/lib/screen-docs';
import { useAppLocale } from '@/components/AdminIntlProvider';

type Tab = 'agent' | 'user' | 'flow';

type SearchResult = {
  module: ModuleDoc;
  screen: ScreenDoc;
  matchedFields: { field: string; label: string; snippet: string }[];
};

const LOCALES = [
  { code: 'nl' as const, label: 'NL', name: 'Nederlands' },
  { code: 'en' as const, label: 'EN', name: 'English' },
  { code: 'tr' as const, label: 'TR', name: 'Türkçe' },
];

function getScreenTitle(code: string): string {
  const entry = Object.values(SCREEN_REGISTRY).find((s) => s.id === code);
  return entry ? `${entry.title} (${entry.titleNl})` : code;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-[#E8364E]/30 text-white rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function getSnippet(text: string, query: string, contextLen = 80): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, contextLen * 2) + (text.length > contextLen * 2 ? '…' : '');
  const start = Math.max(0, idx - contextLen);
  const end = Math.min(text.length, idx + query.length + contextLen);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = '…' + snippet;
  if (end < text.length) snippet = snippet + '…';
  return snippet;
}

function deepSearch(query: string, fieldLabels: { key: keyof ScreenDoc; label: string }[], modules: ModuleDoc[]): SearchResult[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const mod of modules) {
    for (const screen of mod.screens) {
      const title = getScreenTitle(screen.code).toLowerCase();
      const codeMatch = screen.code.toLowerCase().includes(q);
      const titleMatch = title.includes(q);

      const matchedFields: SearchResult['matchedFields'] = [];

      if (codeMatch || titleMatch) {
        matchedFields.push({
          field: 'code',
          label: fieldLabels.find(f => f.key === 'userFlow')?.label ?? 'Screen',
          snippet: `${screen.code} — ${getScreenTitle(screen.code)}`,
        });
      }

      for (const { key, label } of fieldLabels) {
        const value = screen[key];
        if (value.toLowerCase().includes(q)) {
          matchedFields.push({
            field: key,
            label,
            snippet: getSnippet(value, query),
          });
        }
      }

      if (matchedFields.length > 0) {
        results.push({ module: mod, screen, matchedFields });
      }
    }
  }

  return results;
}

export default function ManualPage() {
  const t = useTranslations('nav');
  const tSy = useTranslations('sy');
  const { locale, setLocale } = useAppLocale();
  const [tab, setTab] = useState<Tab>('user');
  const [expandedModule, setExpandedModule] = useState<string | null>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [langOpen, setLangOpen] = useState(false);
  const [localeReady, setLocaleReady] = useState(locale === 'en');

  useEffect(() => {
    if (locale === 'en') { setLocaleReady(true); return; }
    setLocaleReady(false);
    loadLocaleModules(locale).then(() => setLocaleReady(true));
  }, [locale]);

  const modules = localeReady ? getModulesForLocale(locale) : MODULES;

  const searchableFields: { key: keyof ScreenDoc; label: string }[] = useMemo(() => [
    { key: 'userFlow', label: tSy('howItWorks') },
    { key: 'inputs', label: tSy('fieldInputs') },
    { key: 'outputs', label: tSy('fieldOutputs') },
    { key: 'crossScreen', label: tSy('crossScreenEffects') },
    { key: 'agentNotes', label: tSy('fieldAgentNotes') },
  ], [tSy]);

  const searchResults = useMemo(() => deepSearch(searchQuery, searchableFields, modules), [searchQuery, searchableFields, modules]);

  const isSearchActive = searchQuery.length >= 2;

  const flowSteps = tSy('flowSteps').split(',');
  const userFlowSteps = tSy('userFlowSteps').split(',');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'user', label: tSy('tabUser'), icon: <BookOpenCheck className="h-4 w-4" /> },
    { key: 'agent', label: tSy('tabAgent'), icon: <Bot className="h-4 w-4" /> },
    { key: 'flow', label: tSy('tabFlow'), icon: <GitBranch className="h-4 w-4" /> },
  ];

  const currentLocale = LOCALES.find(l => l.code === locale) ?? LOCALES[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-white">
              {tab === 'user' ? tSy('manualTitle') : tab === 'agent' ? tSy('agentTitle') : tSy('flowTitle')}
            </h1>
            <ScreenBadge code="SY10" />
          </div>
          <p className="mt-1 text-sm text-[#6b6b80]">
            {tab === 'user' ? tSy('manualDesc') : tab === 'agent' ? tSy('agentDesc') : tSy('flowDesc')}
          </p>
        </div>

        {/* Language dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 rounded-lg border border-[#1e1e2a] bg-[#12121a] px-3 py-2 text-sm text-white hover:border-[#E8364E]/50 transition-colors"
          >
            <Globe className="h-4 w-4 text-[#6b6b80]" />
            <span>{currentLocale.label}</span>
            <ChevronDown className={`h-3 w-3 text-[#6b6b80] transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-[#1e1e2a] bg-[#12121a] py-1 shadow-lg">
              {LOCALES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLocale(l.code); setLangOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    locale === l.code
                      ? 'bg-[#E8364E]/10 text-[#E8364E]'
                      : 'text-[#6b6b80] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="font-medium">{l.label}</span>
                  <span className="text-xs">{l.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition-colors ${
              tab === tabItem.key
                ? 'bg-[#E8364E] text-white'
                : 'border border-[#1e1e2a] bg-[#12121a] text-[#6b6b80] hover:text-white'
            }`}
          >
            {tabItem.icon}
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ck-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={tSy('searchPlaceholder')}
          className="w-full rounded-lg border border-ck-dark-border bg-ck-dark-card py-2 pl-10 pr-4 text-sm text-white placeholder:text-ck-muted focus:border-ck-red focus:outline-none"
        />
      </div>

      {/* Search Results */}
      {isSearchActive && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6b6b80]">
              {searchResults.length === 0
                ? tSy('noResults', { query: searchQuery })
                : searchResults.length === 1
                ? tSy('resultCount', { count: searchResults.length, query: searchQuery })
                : tSy('resultCountPlural', { count: searchResults.length, query: searchQuery })}
            </p>
            {searchResults.length > 0 && (
              <p className="text-xs text-[#6b6b80]">
                {tSy('searchScope')}
              </p>
            )}
          </div>

          {searchResults.map((result) => (
            <div
              key={result.screen.code}
              className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <span className="rounded bg-[#0a0a0f] px-2 py-1 text-xs font-mono text-[#E8364E]">
                  {result.module.code}
                </span>
                <span className="rounded bg-[#0a0a0f] px-1.5 py-0.5 text-xs font-mono text-[#E8364E]">
                  {result.screen.code}
                </span>
                <span className="text-sm font-medium text-white">
                  {getScreenTitle(result.screen.code)}
                </span>
                <span className="text-xs text-[#6b6b80] capitalize">{result.module.id}</span>
              </div>

              <div className="space-y-2 pl-4 border-l-2 border-[#1e1e2a]">
                {result.matchedFields.map((match, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">
                      {match.label}
                    </p>
                    <p className="mt-0.5 text-sm text-[#6b6b80] leading-relaxed">
                      {highlightMatch(match.snippet, searchQuery)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regular content — hidden while search results are shown */}
      {!isSearchActive && (
        <>
          {/* AI Agent Tab */}
          {tab === 'agent' && (
            <div className="space-y-4">
              {/* System overview card */}
              <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
                <h2 className="text-base font-medium text-white">{tSy('systemOverview')}</h2>
                <div className="mt-4 space-y-3 text-sm text-[#6b6b80]">
                  <p><span className="text-white">Stack:</span> Next.js 14 App Router + Supabase + Vercel + Tailwind CSS</p>
                  <p><span className="text-white">Auth:</span> Supabase Auth with 3 roles (admin, office, tech). Session checked in middleware for /app/* routes.</p>
                  <p><span className="text-white">API pattern:</span> All data via /api/* routes. RESTful. JSON request/response. Auth via Supabase session cookie.</p>
                  <p><span className="text-white">Money:</span> All monetary values stored as integer cents. Never use floats. Display via formatCurrency(cents, locale).</p>
                  <p><span className="text-white">i18n:</span> 3 locales (nl, en, tr) via next-intl. All strings in src/messages/*.json. Screen codes (JB10, ES20...) are never translated.</p>
                  <p><span className="text-white">Domains:</span> colourking.nl (public), admin.colourking.nl (admin app), monitor.colourking.nl (monitoring)</p>
                  <p><span className="text-white">Database:</span> Supabase PostgreSQL. All schema changes via migration files in supabase/migrations/. RLS enabled on all tables.</p>
                </div>
              </div>

              {/* Business flow */}
              <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
                <h2 className="text-base font-medium text-white">{tSy('coreBusinessFlow')}</h2>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  {flowSteps.map((step, i, arr) => (
                    <span key={step} className="flex items-center gap-2">
                      <span className="rounded-md bg-[#0a0a0f] px-3 py-1.5 text-white">{step}</span>
                      {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-[#6b6b80]" />}
                    </span>
                  ))}
                </div>
              </div>

              {/* State machines */}
              <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
                <h2 className="text-base font-medium text-white">{tSy('stateMachines')}</h2>
                <div className="mt-4 space-y-4">
                  {[
                    { name: 'Lead Status', flow: 'new → contacted → quoted → won | lost (terminal from any non-terminal state)' },
                    { name: 'Inspection Status', flow: 'draft → in_progress → review → locked (immutable after lock, snapshot hash created)' },
                    { name: 'Offer Status', flow: 'draft → sent (guard: has_lines) → approved | rejected | superseded' },
                    { name: 'Job Stage', flow: 'intake → quoted → approved → scheduled → checked_in → in_progress → qc → ready → delivered → closed (qc can loop back to in_progress)' },
                    { name: 'Invoice Status', flow: 'draft → sent (guard: has_lines) → paid | overdue | credited | cancelled (only draft can be cancelled; sent uses credit notes)' },
                    { name: 'Part Status', flow: 'needed → ordered → shipped → received | returned' },
                    { name: 'Task Status', flow: 'todo → in_progress → done (any → blocked, blocked → todo)' },
                    { name: 'Document Status', flow: 'draft → issued → cancelled (invoices cannot be cancelled — use credit notes)' },
                    { name: 'VAT Return', flow: 'open → draft → filed (LOCKED) → corrected (filed returns are immutable)' },
                    { name: 'Appointment', flow: 'requested → confirmed → completed | cancelled (inspections auto-confirm)' },
                    { name: 'Portfolio Dossier', flow: 'draft → published (guard: checklist — title, category, vehicle, before+after photos, all redacted, consent) → archived → draft (number kept once assigned)' },
                  ].map((sm) => (
                    <div key={sm.name}>
                      <p className="text-sm font-medium text-white">{sm.name}</p>
                      <p className="mt-1 text-xs text-[#6b6b80] font-mono">{sm.flow}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-screen API reference */}
              <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
                <h2 className="text-base font-medium text-white">{tSy('screenApiRef')}</h2>
                <div className="mt-4 space-y-3">
                  {modules.flatMap((m) =>
                    m.screens.map((s) => (
                      <div key={s.code} className="border-b border-[#1e1e2a] pb-3 last:border-0 last:pb-0">
                        <p className="text-sm font-medium text-white">
                          <span className="mr-2 rounded bg-[#0a0a0f] px-1.5 py-0.5 text-xs font-mono text-[#E8364E]">{s.code}</span>
                          {getScreenTitle(s.code)}
                        </p>
                        <p className="mt-1 text-xs text-[#6b6b80] font-mono leading-relaxed">{s.agentNotes}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Hard rules */}
              <div className="rounded-[10px] border border-[#E8364E]/20 bg-[#E8364E]/5 p-6">
                <h2 className="text-base font-medium text-[#E8364E]">{tSy('hardRules')}</h2>
                <ul className="mt-4 space-y-2 text-sm text-[#6b6b80]">
                  {Array.from({ length: 10 }, (_, i) => (
                    <li key={i}>
                      {i + 1}. {tSy(`rule${i + 1}` as any)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* User Manual Tab */}
          {tab === 'user' && (
            <div className="space-y-2">
              {/* Overview card */}
              <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
                <h2 className="text-base font-medium text-white">{tSy('welcomeTitle')}</h2>
                <p className="mt-2 text-sm text-[#6b6b80]">
                  {tSy('welcomeDesc')}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {userFlowSteps.map((step, i) => (
                    <span key={step} className="flex items-center gap-1 text-xs">
                      <span className="rounded-md bg-[#0a0a0f] px-2 py-1 text-white">{i + 1}. {step}</span>
                    </span>
                  ))}
                </div>
              </div>

              {modules.map((mod) => (
                <div key={mod.id} className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a]">
                  <button
                    onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-[#0a0a0f] px-2 py-1 text-xs font-mono text-[#E8364E]">{mod.code}</span>
                      <span className="text-sm font-medium capitalize text-white">{mod.id}</span>
                      <span className="text-xs text-[#6b6b80]">
                        {mod.screens.length === 1 ? tSy('screenCount', { count: mod.screens.length }) : tSy('screenCountPlural', { count: mod.screens.length })}
                      </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-[#6b6b80] transition-transform ${expandedModule === mod.id ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedModule === mod.id && (
                    <div className="border-t border-[#1e1e2a] p-4 space-y-6">
                      {mod.screens.map((s) => (
                        <div key={s.code} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-[#0a0a0f] px-1.5 py-0.5 text-xs font-mono text-[#E8364E]">{s.code}</span>
                            <h3 className="text-sm font-medium text-white">{getScreenTitle(s.code)}</h3>
                          </div>

                          <div className="space-y-2 pl-4 border-l-2 border-[#1e1e2a]">
                            <div>
                              <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">{tSy('howItWorks')}</p>
                              <p className="mt-1 text-sm text-[#6b6b80] leading-relaxed whitespace-pre-line">{s.userFlow}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">{tSy('fieldInputs')}</p>
                              <p className="mt-1 text-sm text-[#6b6b80]">{s.inputs}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">{tSy('fieldOutputs')}</p>
                              <p className="mt-1 text-sm text-[#6b6b80]">{s.outputs}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">{tSy('crossScreenEffects')}</p>
                              <p className="mt-1 text-sm text-[#6b6b80]">{s.crossScreen}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Business Flow Tab */}
          {tab === 'flow' && <BusinessFlowChart />}
        </>
      )}
    </div>
  );
}
