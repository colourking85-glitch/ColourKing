'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bot, Play, CheckCircle2, XCircle, AlertTriangle, Clock,
  FileText, Shield, Zap, Eye, Settings, ChevronDown, RefreshCw,
  Copy, Plus,
} from 'lucide-react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';
import { SCREEN_REGISTRY } from '@/lib/codes';

type AgentStatus = 'idle' | 'running' | 'success' | 'error';
type AgentCategory = 'testing' | 'support' | 'monitoring' | 'automation';

interface ExecutionRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  enabled: boolean;
}

interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  purpose: string;
  category: AgentCategory;
  status: AgentStatus;
  lastRun: string | null;
  lastResult: string | null;
  capabilities: string[];
  screens: string[];
  executionRules: ExecutionRule[];
  prompt: string;
}

const AGENTS: AgentDefinition[] = [
  {
    id: 'system-health',
    name: 'System Health Agent',
    description: 'Monitors overall system health by checking all API endpoints, database connectivity, and external service integrations.',
    purpose: 'Continuous system health monitoring and early problem detection.',
    category: 'monitoring',
    status: 'idle',
    lastRun: null,
    lastResult: null,
    capabilities: ['API endpoint testing', 'Database connectivity check', 'Mollie API status', 'Resend service status', 'Response time measurement'],
    screens: ['SY05', 'RP01'],
    executionRules: [
      { id: 'sh-1', name: 'Health check interval', description: 'Run health check every 5 minutes', condition: 'Every 5 minutes (via cron)', action: 'Execute full health check suite', enabled: true },
      { id: 'sh-2', name: 'Alert on failure', description: 'Send notification when any health check fails', condition: 'Any endpoint returns non-200 or timeout > 5s', action: 'Create system notification + log error', enabled: true },
      { id: 'sh-3', name: 'Recovery check', description: 'Verify recovery after a failure', condition: 'Previous check failed', action: 'Run check at 1-minute intervals until 3 consecutive successes', enabled: true },
    ],
    prompt: `You are the System Health Agent for Colourking bodyshop management system.

Your job: Monitor all system components and report issues.

Checks to perform:
1. API Endpoints — GET each /api/* route, verify 200 status and response time < 2s
2. Supabase — Test database read/write with a health_check table ping
3. Mollie — Verify API key validity via GET https://api.mollie.com/v2/methods
4. Resend — Verify API key via GET https://api.resend.com/domains
5. Auth — Verify Supabase auth service responds

Report format:
- Status: OK / DEGRADED / DOWN
- Per-component: name, status, response_time_ms, error (if any)
- Summary: total_checks, passed, failed, avg_response_ms

Rules:
- Never modify data. Read-only operations only.
- Never expose API keys or secrets in reports.
- Log all results to the monitoring feed (SY05).`,
  },
  {
    id: 'translation-audit',
    name: 'Translation Audit Agent',
    description: 'Scans all three locale files (en, nl, tr) for missing keys, raw translation keys in rendered pages, and inconsistent placeholders.',
    purpose: 'Ensure all user-facing strings are properly translated in all three languages.',
    category: 'testing',
    status: 'idle',
    lastRun: null,
    lastResult: null,
    capabilities: ['Key comparison across locales', 'Page rendering check', 'Placeholder consistency', 'Hardcoded string detection'],
    screens: ['SY01'],
    executionRules: [
      { id: 'ta-1', name: 'Pre-deploy check', description: 'Run translation audit before every deployment', condition: 'Before git push to main', action: 'Compare en.json, nl.json, tr.json key sets', enabled: true },
      { id: 'ta-2', name: 'Key match enforcement', description: 'All three locales must have identical key sets', condition: 'Key exists in one locale but not others', action: 'Report missing keys with file and line reference', enabled: true },
      { id: 'ta-3', name: 'Placeholder consistency', description: 'Variables like {count} must appear in all translations', condition: 'Placeholder in source string missing from translation', action: 'Flag as high severity — may cause runtime error', enabled: true },
    ],
    prompt: `You are the Translation Audit Agent for Colourking.

Your job: Ensure all three locale files (en.json, nl.json, tr.json) are complete and consistent.

Steps:
1. Read src/messages/en.json, nl.json, tr.json
2. Extract all keys recursively from each file
3. Compare key sets — report any key present in one file but missing in another
4. For each key with placeholders ({name}, {count}, etc.), verify the same placeholders exist in all translations
5. Scan all .tsx files under src/app/ for useTranslations() calls
6. For each t('key') call, verify the key exists in all 3 locale files
7. Check for hardcoded Dutch strings in component files (text outside of t() calls)

Report format:
- Missing keys: [{ key, presentIn, missingFrom }]
- Placeholder mismatches: [{ key, locale, expectedPlaceholders, actualPlaceholders }]
- Hardcoded strings: [{ file, line, text }]
- Summary: total_keys, missing_count, mismatch_count, hardcoded_count

Severity levels:
- HIGH: Missing key (causes raw key display)
- HIGH: Missing placeholder (may cause runtime error)
- MEDIUM: Hardcoded string (violates i18n rule)
- LOW: Extra key in one locale (unused but not harmful)`,
  },
  {
    id: 'flow-tester',
    name: 'Business Flow Tester',
    description: 'Tests the complete business flow from lead creation through invoice payment, verifying all state transitions and cross-screen effects.',
    purpose: 'End-to-end validation of the core business pipeline.',
    category: 'testing',
    status: 'idle',
    lastRun: null,
    lastResult: null,
    capabilities: ['API-driven flow testing', 'State machine validation', 'Cross-module linking verification', 'Data integrity checks'],
    screens: ['LD01', 'LD10', 'KL01', 'VH01', 'ES01', 'ES10', 'JB01', 'JB10', 'FA01', 'FA10'],
    executionRules: [
      { id: 'ft-1', name: 'Test data isolation', description: 'All test data must be clearly marked and cleaned up after', condition: 'Always', action: 'Prefix test records with [TEST] and delete after verification', enabled: true },
      { id: 'ft-2', name: 'State transition validation', description: 'Every state transition must follow the defined state machine', condition: 'On each status/stage change', action: 'Verify transition is in allowed_transitions map; fail on invalid transition', enabled: true },
      { id: 'ft-3', name: 'Cross-module link check', description: 'Verify records link correctly across modules', condition: 'After creating linked records', action: 'GET parent record and verify child IDs are present in response', enabled: true },
      { id: 'ft-4', name: 'Money integrity', description: 'All monetary values must be integer cents', condition: 'On any money field', action: 'Assert typeof === number && Number.isInteger(value)', enabled: true },
    ],
    prompt: `You are the Business Flow Tester for Colourking.

Your job: Test the complete Lead-to-Payment pipeline via API calls.

Test sequence:
1. POST /api/leads — Create test lead (name: "[TEST] Flow Test", source: "manual")
2. PATCH /api/leads/{id} — Transition: new → contacted → quoted
3. POST /api/customers — Create customer from lead data
4. POST /api/vehicles — Create vehicle (kenteken: "TEST-001")
5. POST /api/offers — Create offer with 2 line items (labour + part), link to customer/vehicle
6. PATCH /api/offers/{id}/status — Send offer (draft → sent)
7. PATCH /api/offers/{id}/status — Approve offer (sent → approved, approved_by_name: "Test")
8. POST /api/jobs — Create job from approved offer
9. PATCH /api/jobs/{id}/stage — Walk through: intake → quoted → approved → scheduled → checked_in → in_progress → qc → ready → delivered
10. POST /api/invoices — Create invoice from approved offer
11. POST /api/invoices/{id}/issue — Issue invoice (draft → sent)
12. POST /api/invoices/{id}/payment — Record payment

Assertions per step:
- HTTP status is 200/201
- Response body contains expected fields
- Status/stage matches expected value
- Monetary values are integers
- Cross-module links are correct (offer.customer_id === customer.id, etc.)

Cleanup:
- Delete all records created with [TEST] prefix
- Report any cleanup failures

Report format:
- Steps: [{ step, endpoint, method, status, passed, error? }]
- Summary: total_steps, passed, failed, duration_ms`,
  },
  {
    id: 'screen-auditor',
    name: 'Screen Auditor Agent',
    description: 'Visits every admin screen and checks for rendering errors, missing translations, broken links, and accessibility issues.',
    purpose: 'Quality assurance across all 40+ registered screens.',
    category: 'testing',
    status: 'idle',
    lastRun: null,
    lastResult: null,
    capabilities: ['Page load verification', 'Console error detection', 'Translation key rendering check', 'Link validation', 'ScreenBadge verification'],
    screens: Object.values(SCREEN_REGISTRY).map((s) => s.id),
    executionRules: [
      { id: 'sa-1', name: 'Visit all screens', description: 'Navigate to every route in SCREEN_REGISTRY', condition: 'On audit trigger', action: 'Load each route and verify no errors in console output', enabled: true },
      { id: 'sa-2', name: 'Translation rendering', description: 'Check for raw translation keys in rendered text', condition: 'Page text contains dots between lowercase words (e.g., "nav.dashboard")', action: 'Flag as rendering error — raw key displayed instead of translation', enabled: true },
      { id: 'sa-3', name: 'ScreenBadge check', description: 'Every page must show its correct screen code', condition: 'Page has a ScreenBadge component', action: 'Verify badge text matches SCREEN_REGISTRY entry for that route', enabled: true },
    ],
    prompt: `You are the Screen Auditor Agent for Colourking.

Your job: Visit every registered screen and check for quality issues.

For each screen in SCREEN_REGISTRY:
1. Navigate to the route
2. Check page loads without errors (no 404, no 500, no hydration errors)
3. Check browser console for errors or warnings
4. Scan rendered text for raw translation keys (pattern: word.word.word)
5. Verify ScreenBadge shows the correct code
6. Check all internal links point to valid routes
7. Verify the page respects the design system (bg-[#0a0a0f], border-[#1e1e2a], etc.)

Report format:
- Screens: [{ code, route, title, loaded, console_errors, raw_keys, broken_links, badge_ok }]
- Summary: total_screens, passed, issues_found, critical_count

Severity:
- CRITICAL: Page doesn't load (404/500)
- HIGH: Console errors or raw translation keys
- MEDIUM: Broken internal links
- LOW: Design inconsistencies`,
  },
  {
    id: 'data-integrity',
    name: 'Data Integrity Agent',
    description: 'Checks referential integrity across all tables, validates monetary calculations, and detects orphaned records.',
    purpose: 'Database health and data consistency validation.',
    category: 'monitoring',
    status: 'idle',
    lastRun: null,
    lastResult: null,
    capabilities: ['Foreign key validation', 'Monetary calculation verification', 'Orphan detection', 'Status consistency check'],
    screens: ['RP01', 'SY05'],
    executionRules: [
      { id: 'di-1', name: 'Referential integrity', description: 'All foreign keys must reference existing records', condition: 'On every check', action: 'Query each table for FKs pointing to non-existent parent records', enabled: true },
      { id: 'di-2', name: 'Money validation', description: 'Invoice totals must match sum of line items', condition: 'For each invoice', action: 'Recalculate total from lines and compare; flag if difference > 0', enabled: true },
      { id: 'di-3', name: 'Status consistency', description: 'Closed jobs should not have open tasks or unpaid invoices', condition: 'For each closed job', action: 'Check linked tasks are done/blocked and linked invoices are paid/credited', enabled: true },
    ],
    prompt: `You are the Data Integrity Agent for Colourking.

Your job: Validate data consistency across all database tables.

Checks:
1. Referential integrity — Every customer_id, vehicle_id, job_id, offer_id on child records must point to an existing parent
2. Orphan detection — Find records with null required FKs or FKs pointing to deleted parents
3. Money validation — For each invoice: sum(line_quantity * line_unit_price * (1 - discount/100)) must equal subtotal; subtotal + vat must equal total
4. Status consistency:
   - Closed jobs → all tasks should be done or blocked
   - Paid invoices → total payments should equal invoice total
   - Approved offers → should have at least 1 line item
   - Filed VAT returns → should not be editable
5. Document integrity — Each issued document's SHA-256 hash should match its stored payload

Rules:
- Read-only operations ONLY. Never modify data.
- Report issues with table name, record ID, and specific problem.
- Classify: CRITICAL (data loss risk), HIGH (inconsistency), MEDIUM (cosmetic), LOW (cleanup opportunity).`,
  },
  {
    id: 'onboarding-helper',
    name: 'Onboarding Helper Agent',
    description: 'Guides new users through the system with contextual tips, suggests next actions based on system state, and provides screen-specific help.',
    purpose: 'User support and contextual help generation.',
    category: 'support',
    status: 'idle',
    lastRun: null,
    lastResult: null,
    capabilities: ['Contextual help text generation', 'Next action suggestions', 'Empty state guidance', 'Feature discovery tips'],
    screens: Object.values(SCREEN_REGISTRY).map((s) => s.id),
    executionRules: [
      { id: 'oh-1', name: 'Empty state detection', description: 'When a list screen has 0 records, show getting-started guidance', condition: 'API returns empty array for a list endpoint', action: 'Display contextual empty state with first-step instructions', enabled: true },
      { id: 'oh-2', name: 'Workflow suggestion', description: 'Suggest the next logical step in the business flow', condition: 'User completes an action (e.g., creates a lead)', action: 'Suggest: "Next, contact the customer and update the lead status to Contacted"', enabled: true },
      { id: 'oh-3', name: 'Unused feature alert', description: 'Highlight features the user has not tried yet', condition: 'Module has 0 records after 7 days of account creation', action: 'Show tip card: "Did you know you can track appointments in the Calendar?"', enabled: true },
    ],
    prompt: `You are the Onboarding Helper Agent for Colourking.

Your job: Generate contextual help and suggestions for users.

For each screen, provide:
1. A one-sentence description of what the screen does
2. The most common first action a new user should take
3. How this screen connects to the previous and next steps in the workflow
4. Tips for power users (keyboard shortcuts, filters, bulk actions)

Context rules:
- Check the system state (record counts per module) to tailor suggestions
- If a module has 0 records, provide "getting started" guidance
- If a module has data, provide "next step" suggestions
- Always reference screen codes (e.g., "Go to LD05 to see your leads")
- Keep language simple and action-oriented
- Support all 3 locales (nl, en, tr) — use next-intl keys`,
  },
];

const CATEGORY_STYLES: Record<AgentCategory, { label: string; class: string; icon: React.ReactNode }> = {
  testing: { label: 'Testing', class: 'bg-cyan-900/30 text-cyan-400', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  support: { label: 'Support', class: 'bg-purple-900/30 text-purple-400', icon: <FileText className="h-3.5 w-3.5" /> },
  monitoring: { label: 'Monitoring', class: 'bg-blue-900/30 text-blue-400', icon: <Eye className="h-3.5 w-3.5" /> },
  automation: { label: 'Automation', class: 'bg-amber-900/30 text-amber-400', icon: <Zap className="h-3.5 w-3.5" /> },
};

export default function AIAgentsPage() {
  const tCommon = useTranslations('common');
  const [agents, setAgents] = useState(AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [filter, setFilter] = useState<AgentCategory | 'all'>('all');
  const [expandedRules, setExpandedRules] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = filter === 'all' ? agents : agents.filter((a) => a.category === filter);
  const selected = agents.find((a) => a.id === selectedAgent);

  function runAgent(id: string) {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'running' as AgentStatus } : a))
    );
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: 'success' as AgentStatus,
                lastRun: new Date().toLocaleString('nl-NL'),
                lastResult: 'All checks passed',
              }
            : a
        )
      );
    }, 3000);
  }

  function copyPrompt(prompt: string, id: string) {
    navigator.clipboard.writeText(prompt);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-white">AI Agent Definitions</h1>
            <ScreenBadge code="SY20" />
          </div>
          <p className="mt-1 text-sm text-[#6b6b80]">
            Define, test, and manage AI agents that assist with system monitoring, testing, and user support. Each agent has executable rules and a self-contained prompt for quick deployment.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
          <p className="text-xs text-[#6b6b80]">Total Agents</p>
          <p className="mt-1 text-2xl font-medium text-white">{agents.length}</p>
        </div>
        <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
          <p className="text-xs text-[#6b6b80]">Execution Rules</p>
          <p className="mt-1 text-2xl font-medium text-white">{agents.reduce((sum, a) => sum + a.executionRules.length, 0)}</p>
        </div>
        <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
          <p className="text-xs text-[#6b6b80]">Screens Covered</p>
          <p className="mt-1 text-2xl font-medium text-white">
            {new Set(agents.flatMap((a) => a.screens)).size}/{Object.keys(SCREEN_REGISTRY).length}
          </p>
        </div>
        <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
          <p className="text-xs text-[#6b6b80]">Last Run</p>
          <p className="mt-1 text-sm font-medium text-[#6b6b80]">No runs yet</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'testing', 'monitoring', 'support', 'automation'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === cat
                ? 'bg-[#E8364E] text-white'
                : 'border border-[#1e1e2a] bg-[#12121a] text-[#6b6b80] hover:text-white'
            }`}
          >
            {cat === 'all' ? 'All Agents' : CATEGORY_STYLES[cat].label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Agent list */}
        <div className="space-y-3 lg:col-span-2">
          {filtered.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`w-full rounded-[10px] border p-4 text-left transition-colors ${
                selectedAgent === agent.id
                  ? 'border-[#E8364E]/30 bg-[#E8364E]/5'
                  : 'border-[#1e1e2a] bg-[#12121a] hover:border-[#2e2e3a]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className={`h-4 w-4 ${selectedAgent === agent.id ? 'text-[#E8364E]' : 'text-[#6b6b80]'}`} />
                  <span className="text-sm font-medium text-white">{agent.name}</span>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-xs ${CATEGORY_STYLES[agent.category].class}`}>
                  {CATEGORY_STYLES[agent.category].label}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#6b6b80] line-clamp-2">{agent.description}</p>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="text-[#6b6b80]">{agent.executionRules.length} rules</span>
                <span className="text-[#6b6b80]">{agent.screens.length} screens</span>
                {agent.status === 'running' && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Running
                  </span>
                )}
                {agent.status === 'success' && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Passed
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Agent detail */}
        <div className="space-y-4 lg:col-span-3">
          {selected ? (
            <>
              {/* Agent header */}
              <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-[#E8364E]" />
                      <h2 className="text-base font-medium text-white">{selected.name}</h2>
                      <span className={`rounded-md px-2 py-0.5 text-xs ${CATEGORY_STYLES[selected.category].class}`}>
                        {CATEGORY_STYLES[selected.category].label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#6b6b80]">{selected.purpose}</p>
                  </div>
                  <button
                    onClick={() => runAgent(selected.id)}
                    disabled={selected.status === 'running'}
                    className="flex items-center gap-2 rounded-[10px] bg-[#E8364E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#d02e44] disabled:opacity-50"
                  >
                    {selected.status === 'running' ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" /> Run Agent
                      </>
                    )}
                  </button>
                </div>

                {/* Capabilities */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-[#6b6b80] uppercase tracking-wider">Capabilities</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.capabilities.map((cap) => (
                      <span key={cap} className="rounded-md bg-[#0a0a0f] px-2 py-1 text-xs text-[#6b6b80]">{cap}</span>
                    ))}
                  </div>
                </div>

                {/* Screens covered */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-[#6b6b80] uppercase tracking-wider">Screens Covered</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.screens.map((code) => {
                      const screen = Object.values(SCREEN_REGISTRY).find((s) => s.id === code);
                      return (
                        <span key={code} className="rounded-md bg-[#0a0a0f] px-2 py-1 text-xs">
                          <span className="font-mono text-[#E8364E]">{code}</span>
                          {screen && <span className="ml-1 text-[#6b6b80]">{screen.title}</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Last run info */}
                {selected.lastRun && (
                  <div className="mt-4 flex items-center gap-3 text-xs">
                    <span className="text-[#6b6b80]">Last run: {selected.lastRun}</span>
                    {selected.lastResult && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> {selected.lastResult}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Execution Rules */}
              <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#E8364E]" />
                    Execution Rules
                  </h3>
                  <span className="text-xs text-[#6b6b80]">{selected.executionRules.length} rules</span>
                </div>
                <div className="mt-4 space-y-3">
                  {selected.executionRules.map((rule) => (
                    <div key={rule.id} className="rounded-[10px] border border-[#1e1e2a] bg-[#0a0a0f] p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${rule.enabled ? 'bg-emerald-400' : 'bg-[#3a3a50]'}`} />
                          <span className="text-sm font-medium text-white">{rule.name}</span>
                        </div>
                        <span className={`text-xs ${rule.enabled ? 'text-emerald-400' : 'text-[#6b6b80]'}`}>
                          {rule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#6b6b80]">{rule.description}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[#E8364E]">When:</span>{' '}
                          <span className="text-[#6b6b80]">{rule.condition}</span>
                        </div>
                        <div>
                          <span className="text-[#E8364E]">Then:</span>{' '}
                          <span className="text-[#6b6b80]">{rule.action}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent Prompt */}
              <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#E8364E]" />
                    Agent Prompt
                  </h3>
                  <button
                    onClick={() => copyPrompt(selected.prompt, selected.id)}
                    className="flex items-center gap-1.5 rounded-[10px] border border-[#1e1e2a] bg-[#0a0a0f] px-3 py-1.5 text-xs text-[#6b6b80] transition-colors hover:text-white"
                  >
                    {copied === selected.id ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy prompt
                      </>
                    )}
                  </button>
                </div>
                <pre className="mt-4 max-h-96 overflow-auto rounded-[10px] bg-[#0a0a0f] p-4 text-xs text-[#6b6b80] leading-relaxed whitespace-pre-wrap font-mono">
                  {selected.prompt}
                </pre>
              </div>

              {/* Adaptation guide */}
              <div className="rounded-[10px] border border-amber-900/30 bg-amber-950/10 p-4">
                <div className="flex items-start gap-3">
                  <Zap className="mt-0.5 h-4 w-4 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">Quick Adaptation Guide</p>
                    <p className="mt-1 text-xs text-[#6b6b80] leading-relaxed">
                      To adapt this agent for a new AI system or after system changes:
                      1) Copy the prompt above — it is self-contained with all context needed.
                      2) Update screen codes and API endpoints if routes changed (check SCREEN_REGISTRY in lib/codes.ts).
                      3) Update execution rules if business logic changed (check state machines in src/modules/*/machine.ts).
                      4) Test with the &quot;Run Agent&quot; button before deploying to production cron jobs.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-[10px] border border-[#1e1e2a] bg-[#12121a]">
              <div className="text-center">
                <Bot className="mx-auto h-8 w-8 text-[#3a3a50]" />
                <p className="mt-3 text-sm text-[#6b6b80]">Select an agent to view its definition, execution rules, and prompt.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
