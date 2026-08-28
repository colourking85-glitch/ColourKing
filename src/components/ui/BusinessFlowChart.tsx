'use client';

import { useState } from 'react';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

/* ── colour tokens per module (hex for SVG) ─────────────────────────── */
const MOD_HEX: Record<string, { bg: string; fg: string; border: string }> = {
  LD: { bg: '#78350f20', fg: '#fbbf24', border: '#92400e' },
  KL: { bg: '#581c8720', fg: '#c084fc', border: '#6b21a8' },
  VH: { bg: '#1e3a5f20', fg: '#60a5fa', border: '#1e40af' },
  ES: { bg: '#14532d20', fg: '#4ade80', border: '#166534' },
  JB: { bg: '#164e6320', fg: '#22d3ee', border: '#155e75' },
  PT: { bg: '#7c2d1220', fg: '#fb923c', border: '#9a3412' },
  FA: { bg: '#064e3b20', fg: '#34d399', border: '#065f46' },
  DO: { bg: '#9f123920', fg: '#fb7185', border: '#9f1239' },
  AP: { bg: '#312e8120', fg: '#818cf8', border: '#3730a3' },
  TS: { bg: '#0c4a6e20', fg: '#38bdf8', border: '#0369a1' },
  RP: { bg: '#4c1d9520', fg: '#a78bfa', border: '#5b21b6' },
  BW: { bg: '#365314', fg: '#a3e635', border: '#4d7c0f' },
  PU: { bg: '#83184420', fg: '#f472b6', border: '#9d174d' },
  BK: { bg: '#134e4a20', fg: '#2dd4bf', border: '#115e59' },
  SY: { bg: '#33415520', fg: '#94a3b8', border: '#475569' },
};

/* ── Flow data ──────────────────────────────────────────────────────── */
type FlowNode = {
  id: string;
  label: string;
  module: string;
  screens: string[];
  x: number;
  y: number;
  w: number;
  h: number;
  desc: string;
};

type FlowEdge = {
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
};

const NODES: FlowNode[] = [
  // Row 0: Entry points
  { id: 'website', label: 'Public Website', module: 'SY', screens: [], x: 60, y: 40, w: 150, h: 56, desc: 'colourking.nl — customer-facing pages with contact, offerte, and booking forms' },
  { id: 'walk-in', label: 'Walk-in / Phone', module: 'SY', screens: [], x: 260, y: 40, w: 150, h: 56, desc: 'Direct customer contact via phone, email, or walk-in visits' },

  // Row 1: Lead management
  { id: 'lead', label: 'Lead', module: 'LD', screens: ['LD01', 'LD05', 'LD10'], x: 160, y: 140, w: 150, h: 64, desc: 'All customer enquiries enter as leads. Track status from new → contacted → quoted → won/lost. Upload damage photos, send email replies.' },

  // Row 2: Customer + Vehicle
  { id: 'customer', label: 'Customer', module: 'KL', screens: ['KL01', 'KL02', 'KL03', 'KL05'], x: 60, y: 250, w: 140, h: 56, desc: 'Customer records: private, company, fleet, or dealer. Linked to vehicles, offers, jobs, and invoices.' },
  { id: 'vehicle', label: 'Vehicle', module: 'VH', screens: ['VH01', 'VH05', 'VH10'], x: 250, y: 250, w: 140, h: 56, desc: 'Vehicle records with RDW auto-fill. Track kenteken, make, model, colour, paint code. WOK flag for total loss.' },

  // Row 3: Offer
  { id: 'offer', label: 'Offer / Quote', module: 'ES', screens: ['ES01', 'ES05', 'ES10'], x: 460, y: 250, w: 160, h: 64, desc: 'Create offers with line items (labour, parts, materials). Draft → Sent → Approved/Rejected/Superseded. Preview & print.' },

  // Row 4: Job (central)
  { id: 'job', label: 'Repair Job', module: 'JB', screens: ['JB01', 'JB05', 'JB10', 'JB15'], x: 460, y: 380, w: 180, h: 72, desc: 'Central hub: 10-stage pipeline from intake to closed. Assigned technicians, photo uploads (before/during/after), event timeline, estimated delivery.' },

  // Row 4: Supporting
  { id: 'parts', label: 'Parts', module: 'PT', screens: ['PT01', 'PT05'], x: 700, y: 360, w: 130, h: 56, desc: 'Track parts per job: needed → ordered → shipped → received. Blocking flag prevents job advancement.' },
  { id: 'tasks', label: 'Tasks', module: 'TS', screens: ['TS01', 'TS05', 'TS10'], x: 700, y: 440, w: 130, h: 56, desc: 'Work tasks per job. Clock in/out for time tracking. Status: todo → in_progress → done. Feeds into planning grid.' },
  { id: 'appointment', label: 'Appointments', module: 'AP', screens: ['AP01', 'AP05', 'AP10'], x: 60, y: 390, w: 150, h: 56, desc: 'Weekly calendar for scheduling. Types: inspection, delivery, pickup. Colour-coded by type, border by status.' },

  // Row 5: Documents + Handover
  { id: 'repairorder', label: 'Repair Order', module: 'DO', screens: ['DO20'], x: 260, y: 510, w: 150, h: 56, desc: 'Generated from approved jobs. Auto-numbered, print-ready A4 document.' },
  { id: 'handover', label: 'Handover Note', module: 'DO', screens: ['DO21', 'DO22'], x: 460, y: 510, w: 160, h: 56, desc: 'Delivery document with customer signature. Draft → Issued → Shared. Public view for customer signing.' },

  // Row 6: Invoice + Payment
  { id: 'invoice', label: 'Invoice', module: 'FA', screens: ['FA01', 'FA05', 'FA10'], x: 460, y: 620, w: 160, h: 64, desc: 'Professional invoices from approved offers. Issue → Track payment → Mollie payment links. Credit notes for corrections.' },

  // Row 7: Finance
  { id: 'vat', label: 'VAT / BTW', module: 'BW', screens: ['BW05', 'BW40'], x: 260, y: 720, w: 140, h: 56, desc: 'Dutch BTW returns by period. Filed returns are permanently locked. VAT calculator for quick lookups.' },
  { id: 'purchase', label: 'Purchases', module: 'PU', screens: ['PU01', 'PU05'], x: 460, y: 720, w: 140, h: 56, desc: 'Incoming supplier invoices. Auto-calculated VAT. Categories feed into bookkeeping.' },
  { id: 'bookkeeping', label: 'Bookkeeping', module: 'BK', screens: ['BK10'], x: 660, y: 720, w: 140, h: 56, desc: 'Export CSV data for accountant: invoices, purchases, VAT, profit/loss summary.' },

  // Row 0-right: Reports + Dashboard
  { id: 'dashboard', label: 'Dashboard', module: 'RP', screens: ['RP01'], x: 700, y: 40, w: 140, h: 56, desc: 'Key metrics: open leads, active jobs, pending invoices, monthly revenue. Activity feed.' },
  { id: 'reports', label: 'Reports', module: 'RP', screens: ['RP10'], x: 700, y: 130, w: 140, h: 56, desc: 'Revenue, Jobs, Workload, Customers — aggregated charts and figures by date range.' },

  // Documents archive
  { id: 'documents', label: 'Doc Archive', module: 'DO', screens: ['DO03', 'DO05'], x: 60, y: 620, w: 150, h: 56, desc: 'Central archive of all system documents with frozen payload and SHA-256 integrity hash.' },

  // Notifications
  { id: 'notifications', label: 'Notifications', module: 'SY', screens: ['SY05'], x: 700, y: 230, w: 140, h: 56, desc: 'Real-time event feed: new leads, stage changes, document issued, appointment status.' },
];

const EDGES: FlowEdge[] = [
  // Entry → Lead
  { from: 'website', to: 'lead', label: 'form submit' },
  { from: 'walk-in', to: 'lead', label: 'manual entry' },

  // Lead → Customer + Vehicle
  { from: 'lead', to: 'customer', label: 'convert' },
  { from: 'lead', to: 'vehicle', label: 'convert' },

  // Lead → Offer
  { from: 'lead', to: 'offer', label: 'quote', style: 'dashed' },

  // Customer/Vehicle → Offer
  { from: 'customer', to: 'offer' },
  { from: 'vehicle', to: 'offer' },

  // Offer → Job
  { from: 'offer', to: 'job', label: 'approved' },

  // Job → supporting
  { from: 'job', to: 'parts' },
  { from: 'job', to: 'tasks' },
  { from: 'job', to: 'appointment', style: 'dashed' },

  // Job → documents
  { from: 'job', to: 'repairorder', label: 'approved stage' },
  { from: 'job', to: 'handover', label: 'ready stage' },

  // Handover → Invoice
  { from: 'handover', to: 'invoice', label: 'delivered' },

  // Offer → Invoice (direct)
  { from: 'offer', to: 'invoice', label: 'create', style: 'dashed' },

  // Invoice → Finance
  { from: 'invoice', to: 'vat' },
  { from: 'invoice', to: 'documents' },
  { from: 'purchase', to: 'vat' },
  { from: 'vat', to: 'bookkeeping' },
  { from: 'purchase', to: 'bookkeeping' },
  { from: 'invoice', to: 'bookkeeping', style: 'dashed' },

  // Aggregation → Reports/Dashboard
  { from: 'lead', to: 'dashboard', style: 'dashed' },
  { from: 'job', to: 'dashboard', style: 'dashed' },
  { from: 'invoice', to: 'dashboard', style: 'dashed' },
  { from: 'invoice', to: 'reports', style: 'dashed' },
  { from: 'tasks', to: 'reports', style: 'dashed' },

  // Notifications
  { from: 'lead', to: 'notifications', style: 'dashed' },
  { from: 'job', to: 'notifications', style: 'dashed' },
  { from: 'invoice', to: 'notifications', style: 'dashed' },
  { from: 'appointment', to: 'notifications', style: 'dashed' },

  // Documents archive
  { from: 'repairorder', to: 'documents' },
  { from: 'handover', to: 'documents' },
];

/* ── Job pipeline stages ────────────────────────────────────────────── */
const JOB_STAGES = [
  { id: 'intake', label: 'Intake', color: '#94a3b8' },
  { id: 'quoted', label: 'Quoted', color: '#fbbf24' },
  { id: 'approved', label: 'Approved', color: '#4ade80' },
  { id: 'scheduled', label: 'Scheduled', color: '#60a5fa' },
  { id: 'checked_in', label: 'Checked In', color: '#818cf8' },
  { id: 'in_progress', label: 'In Progress', color: '#22d3ee' },
  { id: 'qc', label: 'QC', color: '#f472b6' },
  { id: 'ready', label: 'Ready', color: '#34d399' },
  { id: 'delivered', label: 'Delivered', color: '#a78bfa' },
  { id: 'closed', label: 'Closed', color: '#6b7280' },
];

/* ── Edge path calculation ──────────────────────────────────────────── */
function getEdgePath(from: FlowNode, to: FlowNode): string {
  const fx = from.x + from.w / 2;
  const fy = from.y + from.h / 2;
  const tx = to.x + to.w / 2;
  const ty = to.y + to.h / 2;

  // Determine connection points (edge of boxes)
  let sx = fx, sy = fy, ex = tx, ey = ty;

  const dx = tx - fx;
  const dy = ty - fy;

  if (Math.abs(dy) > Math.abs(dx)) {
    // Vertical connection
    if (dy > 0) { sy = from.y + from.h; ey = to.y; }
    else { sy = from.y; ey = to.y + to.h; }
    sx = fx; ex = tx;
  } else {
    // Horizontal connection
    if (dx > 0) { sx = from.x + from.w; ex = to.x; }
    else { sx = from.x; ex = to.x + to.w; }
    sy = fy; ey = ty;
  }

  // Bezier curve
  const midX = (sx + ex) / 2;
  const midY = (sy + ey) / 2;

  if (Math.abs(dy) > Math.abs(dx)) {
    return `M${sx},${sy} C${sx},${midY} ${ex},${midY} ${ex},${ey}`;
  }
  return `M${sx},${sy} C${midX},${sy} ${midX},${ey} ${ex},${ey}`;
}

function getEdgeLabelPos(from: FlowNode, to: FlowNode): { x: number; y: number } {
  const fx = from.x + from.w / 2;
  const fy = from.y + from.h / 2;
  const tx = to.x + to.w / 2;
  const ty = to.y + to.h / 2;
  return { x: (fx + tx) / 2, y: (fy + ty) / 2 };
}

/* ── Component ──────────────────────────────────────────────────────── */
export function BusinessFlowChart() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const nodeMap = new Map(NODES.map(n => [n.id, n]));

  const connectedEdges = hoveredNode
    ? EDGES.filter(e => e.from === hoveredNode || e.to === hoveredNode)
    : [];
  const connectedNodeIds = new Set(
    connectedEdges.flatMap(e => [e.from, e.to])
  );

  const selectedNode = selected ? nodeMap.get(selected) : null;

  return (
    <div className="space-y-4">
      {/* Main flow chart */}
      <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium text-white">E2E Business Flow</h2>
          <span className="text-[10px] text-[#6b6b80]">Click a node for details · Hover to see connections</span>
        </div>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 900 800" className="w-full min-w-[700px]" style={{ maxHeight: '520px' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 7" refX="9" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,3.5 L0,7 Z" fill="#4a4a5a" />
              </marker>
              <marker id="arrow-hl" viewBox="0 0 10 7" refX="9" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,3.5 L0,7 Z" fill="#E8364E" />
              </marker>
            </defs>

            {/* Edges */}
            {EDGES.map((e, i) => {
              const from = nodeMap.get(e.from);
              const to = nodeMap.get(e.to);
              if (!from || !to) return null;

              const isHighlighted = hoveredNode && (e.from === hoveredNode || e.to === hoveredNode);
              const isDimmed = hoveredNode && !isHighlighted;

              return (
                <g key={i}>
                  <path
                    d={getEdgePath(from, to)}
                    fill="none"
                    stroke={isHighlighted ? '#E8364E' : '#2a2a3a'}
                    strokeWidth={isHighlighted ? 2 : 1}
                    strokeDasharray={e.style === 'dashed' ? '6,4' : undefined}
                    opacity={isDimmed ? 0.15 : 1}
                    markerEnd={isHighlighted ? 'url(#arrow-hl)' : 'url(#arrow)'}
                    className="transition-all duration-200"
                  />
                  {e.label && isHighlighted && (() => {
                    const pos = getEdgeLabelPos(from, to);
                    return (
                      <text
                        x={pos.x}
                        y={pos.y - 6}
                        textAnchor="middle"
                        className="text-[8px] fill-[#E8364E] font-medium"
                      >
                        {e.label}
                      </text>
                    );
                  })()}
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((n) => {
              const c = MOD_HEX[n.module] ?? MOD_HEX.SY;
              const isHovered = hoveredNode === n.id;
              const isConnected = connectedNodeIds.has(n.id);
              const isDimmed = hoveredNode && !isHovered && !isConnected;
              const isSelected = selected === n.id;

              return (
                <g
                  key={n.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(selected === n.id ? null : n.id)}
                  onMouseEnter={() => setHoveredNode(n.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  opacity={isDimmed ? 0.25 : 1}
                  style={{ transition: 'opacity 200ms' }}
                >
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={n.h}
                    rx={8}
                    fill={isSelected ? c.bg.replace('20', '60') : c.bg}
                    stroke={isSelected || isHovered ? c.fg : c.border}
                    strokeWidth={isSelected || isHovered ? 2 : 1}
                  />
                  {/* Module badge */}
                  <rect
                    x={n.x + 8}
                    y={n.y + 6}
                    width={28}
                    height={16}
                    rx={3}
                    fill={c.border}
                    opacity={0.6}
                  />
                  <text
                    x={n.x + 22}
                    y={n.y + 17}
                    textAnchor="middle"
                    className="text-[8px] font-mono font-bold"
                    fill={c.fg}
                  >
                    {n.module}
                  </text>
                  {/* Label */}
                  <text
                    x={n.x + n.w / 2}
                    y={n.y + n.h / 2 + 8}
                    textAnchor="middle"
                    className="text-[11px] font-medium"
                    fill="white"
                  >
                    {n.label}
                  </text>
                  {/* Screen count */}
                  {n.screens.length > 0 && (
                    <text
                      x={n.x + n.w - 10}
                      y={n.y + 17}
                      textAnchor="end"
                      className="text-[8px]"
                      fill={c.fg}
                      opacity={0.7}
                    >
                      {n.screens.length}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-5">
          <div className="flex items-center gap-3">
            <ScreenBadge code={selectedNode.module + '00'} />
            <h3 className="text-sm font-medium text-white">{selectedNode.label}</h3>
            {selectedNode.screens.length > 0 && (
              <div className="flex gap-1">
                {selectedNode.screens.map(s => (
                  <ScreenBadge key={s} code={s} />
                ))}
              </div>
            )}
            <button
              onClick={() => setSelected(null)}
              className="ml-auto text-xs text-[#6b6b80] hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#6b6b80]">{selectedNode.desc}</p>
          {/* Show connections */}
          <div className="mt-3 flex flex-wrap gap-2">
            {EDGES.filter(e => e.from === selectedNode.id || e.to === selectedNode.id).map((e, i) => {
              const other = e.from === selectedNode.id ? e.to : e.from;
              const otherNode = nodeMap.get(other);
              const direction = e.from === selectedNode.id ? '→' : '←';
              return (
                <button
                  key={i}
                  onClick={() => setSelected(other)}
                  className="flex items-center gap-1 rounded-md border border-[#1e1e2a] bg-[#0a0a0f] px-2 py-1 text-[11px] text-[#6b6b80] transition-colors hover:border-[#E8364E]/30 hover:text-white"
                >
                  <span className="text-[#E8364E]">{direction}</span>
                  {otherNode?.label}
                  {e.label && <span className="text-[9px] text-[#4a4a5a]">({e.label})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Job pipeline detail */}
      <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-5">
        <h2 className="text-base font-medium text-white">Job Pipeline — 10 Stages</h2>
        <p className="mt-1 text-xs text-[#6b6b80]">Linear pipeline with QC rework loop. Each stage has guard conditions and triggers.</p>
        <div className="mt-4 flex flex-wrap items-center gap-1">
          {JOB_STAGES.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <div
                className="rounded-md border px-3 py-1.5 text-[11px] font-medium"
                style={{ borderColor: s.color + '40', color: s.color, backgroundColor: s.color + '10' }}
              >
                {s.label}
              </div>
              {i < JOB_STAGES.length - 1 && (
                <svg width="20" height="12" viewBox="0 0 20 12" className="shrink-0">
                  <path d="M2,6 L15,6" stroke="#3a3a4a" strokeWidth="1.5" />
                  <path d="M13,2 L17,6 L13,10" fill="none" stroke="#3a3a4a" strokeWidth="1.5" />
                </svg>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-[#f472b6]/20 bg-[#f472b6]/5 px-3 py-2 text-[11px] text-[#f472b6]">
          <span className="font-medium">↩ QC Loop:</span>
          <span className="text-[#6b6b80]">QC can send job back to In Progress for rework — the only non-linear transition</span>
        </div>
      </div>

      {/* State machines grid */}
      <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-5">
        <h2 className="text-base font-medium text-white">State Machines</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'Lead', module: 'LD', states: ['new', 'contacted', 'quoted', 'won', 'lost'], terminal: ['won', 'lost'] },
            { name: 'Offer', module: 'ES', states: ['draft', 'sent', 'approved', 'rejected', 'superseded'], terminal: ['approved', 'rejected', 'superseded'] },
            { name: 'Invoice', module: 'FA', states: ['draft', 'sent', 'paid', 'overdue', 'credited', 'cancelled'], terminal: ['paid', 'credited', 'cancelled'] },
            { name: 'Part', module: 'PT', states: ['needed', 'ordered', 'shipped', 'received', 'returned'], terminal: ['received', 'returned'] },
            { name: 'Task', module: 'TS', states: ['todo', 'in_progress', 'done', 'blocked'], terminal: ['done'] },
            { name: 'Document', module: 'DO', states: ['draft', 'issued', 'cancelled'], terminal: ['issued', 'cancelled'] },
            { name: 'VAT Return', module: 'BW', states: ['open', 'draft', 'filed', 'corrected'], terminal: ['filed'] },
            { name: 'Appointment', module: 'AP', states: ['requested', 'confirmed', 'completed', 'cancelled'], terminal: ['completed', 'cancelled'] },
            { name: 'Handover', module: 'DO', states: ['draft', 'issued', 'shared', 'signed'], terminal: ['signed'] },
          ].map(sm => {
            const c = MOD_HEX[sm.module] ?? MOD_HEX.SY;
            return (
              <div key={sm.name} className="rounded-lg border border-[#1e1e2a] bg-[#0a0a0f] p-3">
                <div className="flex items-center gap-2">
                  <ScreenBadge code={sm.module} />
                  <span className="text-xs font-medium text-white">{sm.name}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {sm.states.map(s => (
                    <span
                      key={s}
                      className="rounded px-1.5 py-0.5 text-[10px] font-mono"
                      style={{
                        backgroundColor: sm.terminal.includes(s) ? c.fg + '20' : '#1e1e2a',
                        color: sm.terminal.includes(s) ? c.fg : '#6b6b80',
                        border: sm.terminal.includes(s) ? `1px solid ${c.fg}40` : '1px solid transparent',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module map */}
      <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-5">
        <h2 className="text-base font-medium text-white">Module Map — All Screens</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { code: 'LD', name: 'Leads', screens: ['LD01', 'LD05', 'LD10'] },
            { code: 'KL', name: 'Customers', screens: ['KL01', 'KL02', 'KL03', 'KL05'] },
            { code: 'VH', name: 'Vehicles', screens: ['VH01', 'VH05', 'VH10'] },
            { code: 'ES', name: 'Offers', screens: ['ES01', 'ES05', 'ES10'] },
            { code: 'JB', name: 'Jobs', screens: ['JB01', 'JB05', 'JB10', 'JB15'] },
            { code: 'PT', name: 'Parts', screens: ['PT01', 'PT05'] },
            { code: 'TS', name: 'Tasks', screens: ['TS01', 'TS05', 'TS10'] },
            { code: 'FA', name: 'Invoices', screens: ['FA01', 'FA05', 'FA10'] },
            { code: 'DO', name: 'Documents', screens: ['DO03', 'DO05', 'DO20', 'DO21', 'DO22'] },
            { code: 'AP', name: 'Appointments', screens: ['AP01', 'AP05', 'AP10'] },
            { code: 'RP', name: 'Reports', screens: ['RP01', 'RP10'] },
            { code: 'BW', name: 'VAT', screens: ['BW05', 'BW40'] },
            { code: 'PU', name: 'Purchases', screens: ['PU01', 'PU05'] },
            { code: 'BK', name: 'Bookkeeping', screens: ['BK10'] },
            { code: 'SY', name: 'System', screens: ['SY01', 'SY02', 'SY03', 'SY05', 'SY10', 'SY15', 'SY20', 'SY25', 'SY30', 'SY35', 'SY40', 'SY45', 'SY50'] },
          ].map(m => {
            const c = MOD_HEX[m.code] ?? MOD_HEX.SY;
            return (
              <div
                key={m.code}
                className="flex items-start gap-3 rounded-lg border border-[#1e1e2a] bg-[#0a0a0f] p-3"
                style={{ borderLeftColor: c.fg, borderLeftWidth: 3 }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold" style={{ color: c.fg }}>{m.code}</span>
                    <span className="text-xs font-medium text-white">{m.name}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {m.screens.map(s => (
                      <ScreenBadge key={s} code={s} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
