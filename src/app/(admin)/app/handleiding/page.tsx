'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpenCheck, Bot, ChevronRight, ChevronDown, GitBranch, Search, X } from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { BusinessFlowChart } from '@/components/ui/BusinessFlowChart';
import { SCREEN_REGISTRY } from '@/lib/codes';
import { MODULES, type ScreenDoc, type ModuleDoc } from '@/lib/screen-docs';

type Tab = 'agent' | 'user' | 'flow';

type SearchResult = {
  module: ModuleDoc;
  screen: ScreenDoc;
  matchedFields: { field: string; label: string; snippet: string }[];
};

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

const SEARCHABLE_FIELDS: { key: keyof ScreenDoc; label: string }[] = [
  { key: 'userFlow', label: 'How it works' },
  { key: 'inputs', label: 'Inputs' },
  { key: 'outputs', label: 'Outputs' },
  { key: 'crossScreen', label: 'Cross-screen' },
  { key: 'agentNotes', label: 'Agent notes' },
];

function deepSearch(query: string): SearchResult[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const mod of MODULES) {
    for (const screen of mod.screens) {
      const title = getScreenTitle(screen.code).toLowerCase();
      const codeMatch = screen.code.toLowerCase().includes(q);
      const titleMatch = title.includes(q);

      const matchedFields: SearchResult['matchedFields'] = [];

      if (codeMatch || titleMatch) {
        matchedFields.push({
          field: 'code',
          label: 'Screen',
          snippet: `${screen.code} — ${getScreenTitle(screen.code)}`,
        });
      }

      for (const { key, label } of SEARCHABLE_FIELDS) {
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
  const [tab, setTab] = useState<Tab>('user');
  const [expandedModule, setExpandedModule] = useState<string | null>('leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const searchResults = useMemo(() => deepSearch(searchQuery), [searchQuery]);

  const handleSearchToggle = useCallback(() => {
    setSearchOpen((prev) => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  }, []);

  const isSearchActive = searchOpen && searchQuery.length >= 2;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'user', label: 'End User Manual', icon: <BookOpenCheck className="h-4 w-4" /> },
    { key: 'agent', label: 'AI Agent Guide', icon: <Bot className="h-4 w-4" /> },
    { key: 'flow', label: 'Business Flow', icon: <GitBranch className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-white">
              {tab === 'user' ? 'End User Manual' : tab === 'agent' ? 'AI Agent Quick Reference' : 'Business Flow Chart'}
            </h1>
            <ScreenBadge code="SY10" />
          </div>
          <p className="mt-1 text-sm text-[#6b6b80]">
            {tab === 'user'
              ? 'Complete guide to every screen: what it does, how to use it, and how it connects to other parts of the system.'
              : tab === 'agent'
              ? 'Machine-readable reference for AI agents to understand, navigate, and test the Colourking system.'
              : 'Visual end-to-end overview of all modules, screens, state machines, and how data flows through the system.'}
          </p>
        </div>
      </div>

      {/* Tab switcher + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-[#E8364E] text-white'
                  : 'border border-[#1e1e2a] bg-[#12121a] text-[#6b6b80] hover:text-white'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {searchOpen && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b80]" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all manuals…"
                className="h-9 w-72 rounded-[10px] border border-[#1e1e2a] bg-[#0a0a0f] pl-9 pr-3 text-sm text-white placeholder-[#6b6b80] outline-none focus:border-[#E8364E]/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b6b80] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          <button
            onClick={handleSearchToggle}
            className={`flex h-9 w-9 items-center justify-center rounded-[10px] border transition-colors ${
              searchOpen
                ? 'border-[#E8364E]/50 bg-[#E8364E]/10 text-[#E8364E]'
                : 'border-[#1e1e2a] bg-[#12121a] text-[#6b6b80] hover:text-white'
            }`}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {isSearchActive && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6b6b80]">
              {searchResults.length === 0
                ? `No results for "${searchQuery}"`
                : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`}
            </p>
            {searchResults.length > 0 && (
              <p className="text-xs text-[#6b6b80]">
                Searching across all screens: flows, inputs, outputs, cross-screen effects & agent notes
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
                <h2 className="text-base font-medium text-white">System Overview</h2>
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
                <h2 className="text-base font-medium text-white">Core Business Flow</h2>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  {['Lead', 'Offer', 'Approval', 'Repair Order', 'Job', 'Parts', 'Tasks', 'Handover', 'Invoice', 'Paid', 'Delivered', 'Portfolio'].map((step, i, arr) => (
                    <span key={step} className="flex items-center gap-2">
                      <span className="rounded-md bg-[#0a0a0f] px-3 py-1.5 text-white">{step}</span>
                      {i < arr.length - 1 && <ChevronRight className="h-3 w-3 text-[#6b6b80]" />}
                    </span>
                  ))}
                </div>
              </div>

              {/* State machines */}
              <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
                <h2 className="text-base font-medium text-white">State Machines</h2>
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
                <h2 className="text-base font-medium text-white">Screen API Reference</h2>
                <div className="mt-4 space-y-3">
                  {MODULES.flatMap((m) =>
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
                <h2 className="text-base font-medium text-[#E8364E]">Hard Rules (Never Violate)</h2>
                <ul className="mt-4 space-y-2 text-sm text-[#6b6b80]">
                  <li>1. All schema changes via migration files in supabase/migrations/. Never use the Supabase dashboard.</li>
                  <li>2. Regenerate src/types/database.ts after every migration, same commit.</li>
                  <li>3. Never use SUPABASE_SERVICE_ROLE_KEY in client components or app/(public).</li>
                  <li>4. Never edit an issued document or locked VAT period. Supersede or correct instead.</li>
                  <li>5. Money is stored in cents as integers. Never floats.</li>
                  <li>6. All user-facing strings go through next-intl. No hardcoded Dutch.</li>
                  <li>7. Screen codes (JB10, ES20...) are never translated and never renamed.</li>
                  <li>8. New tables must have RLS enabled and a policy.</li>
                  <li>9. New screens must be registered in lib/codes.ts.</li>
                  <li>10. New strings must exist in all three locales (en, nl, tr).</li>
                </ul>
              </div>
            </div>
          )}

          {/* User Manual Tab */}
          {tab === 'user' && (
            <div className="space-y-2">
              {/* Overview card */}
              <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
                <h2 className="text-base font-medium text-white">Welcome to Colourking</h2>
                <p className="mt-2 text-sm text-[#6b6b80]">
                  Colourking is a complete bodyshop management system. It handles the full workflow from receiving a customer enquiry (lead), through quoting, repair, and final delivery with invoicing. Use the sections below to learn how each part of the system works and how they connect to each other.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Lead', 'Offer', 'Approval', 'Repair Order', 'Job', 'Parts', 'Tasks', 'QC', 'Handover', 'Invoice', 'Payment', 'Delivered'].map((step, i) => (
                    <span key={step} className="flex items-center gap-1 text-xs">
                      <span className="rounded-md bg-[#0a0a0f] px-2 py-1 text-white">{i + 1}. {step}</span>
                    </span>
                  ))}
                </div>
              </div>

              {MODULES.map((mod) => (
                <div key={mod.id} className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a]">
                  <button
                    onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-[#0a0a0f] px-2 py-1 text-xs font-mono text-[#E8364E]">{mod.code}</span>
                      <span className="text-sm font-medium capitalize text-white">{mod.id}</span>
                      <span className="text-xs text-[#6b6b80]">{mod.screens.length} screen{mod.screens.length > 1 ? 's' : ''}</span>
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
                              <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">How it works</p>
                              <p className="mt-1 text-sm text-[#6b6b80] leading-relaxed whitespace-pre-line">{s.userFlow}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">Inputs</p>
                              <p className="mt-1 text-sm text-[#6b6b80]">{s.inputs}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">Outputs</p>
                              <p className="mt-1 text-sm text-[#6b6b80]">{s.outputs}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-[#E8364E] uppercase tracking-wider">Cross-screen effects</p>
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
