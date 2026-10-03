'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ScreenBadge } from '@/components/ui/ScreenBadge';

/* ── colour tokens per module (hex for SVG) ─────────────────────────── */
const MOD_HEX: Record<string, { bg: string; fg: string; border: string }> = {
  LD: { bg: '#78350f20', fg: '#fbbf24', border: '#92400e' },
  KL: { bg: '#581c8720', fg: '#c084fc', border: '#6b21a8' },
  VH: { bg: '#1e3a5f20', fg: '#60a5fa', border: '#1e40af' },
  ES: { bg: '#14532d20', fg: '#4ade80', border: '#166534' },
  PF: { bg: '#86198f20', fg: '#e879f9', border: '#a21caf' },
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
  IN: { bg: '#71370020', fg: '#fbbf24', border: '#a16207' },
  SY: { bg: '#33415520', fg: '#94a3b8', border: '#475569' },
};

/* ── Flow data ──────────────────────────────────────────────────────── */
type FlowNode = {
  id: string;
  labelKey: string;
  descKey: string;
  module: string;
  screens: string[];
  x: number;
  y: number;
  w: number;
  h: number;
};

type FlowEdge = {
  from: string;
  to: string;
  labelKey?: string;
  style?: 'solid' | 'dashed';
};

const NODES: FlowNode[] = [
  { id: 'website', labelKey: 'bfNodeWebsite', descKey: 'bfNodeWebsiteDesc', module: 'SY', screens: [], x: 60, y: 40, w: 150, h: 56 },
  { id: 'walk-in', labelKey: 'bfNodeWalkin', descKey: 'bfNodeWalkinDesc', module: 'SY', screens: [], x: 260, y: 40, w: 150, h: 56 },
  { id: 'lead', labelKey: 'bfNodeLead', descKey: 'bfNodeLeadDesc', module: 'LD', screens: ['LD01', 'LD05', 'LD10'], x: 160, y: 140, w: 150, h: 64 },
  { id: 'customer', labelKey: 'bfNodeCustomer', descKey: 'bfNodeCustomerDesc', module: 'KL', screens: ['KL01', 'KL02', 'KL03', 'KL05'], x: 60, y: 260, w: 140, h: 56 },
  { id: 'vehicle', labelKey: 'bfNodeVehicle', descKey: 'bfNodeVehicleDesc', module: 'VH', screens: ['VH01', 'VH05', 'VH10'], x: 250, y: 260, w: 140, h: 56 },
  { id: 'offer', labelKey: 'bfNodeOffer', descKey: 'bfNodeOfferDesc', module: 'ES', screens: ['ES01', 'ES05', 'ES10'], x: 460, y: 260, w: 160, h: 64 },
  { id: 'portfolio', labelKey: 'bfNodePortfolio', descKey: 'bfNodePortfolioDesc', module: 'PF', screens: ['PF01', 'PF05', 'PF10'], x: 160, y: 360, w: 160, h: 56 },
  { id: 'job', labelKey: 'bfNodeJob', descKey: 'bfNodeJobDesc', module: 'JB', screens: ['JB01', 'JB05', 'JB10', 'JB15'], x: 460, y: 400, w: 180, h: 72 },
  { id: 'parts', labelKey: 'bfNodeParts', descKey: 'bfNodePartsDesc', module: 'PT', screens: ['PT01', 'PT05'], x: 700, y: 380, w: 130, h: 56 },
  { id: 'tasks', labelKey: 'bfNodeTasks', descKey: 'bfNodeTasksDesc', module: 'TS', screens: ['TS01', 'TS05', 'TS10'], x: 700, y: 460, w: 130, h: 56 },
  { id: 'appointment', labelKey: 'bfNodeAppointment', descKey: 'bfNodeAppointmentDesc', module: 'AP', screens: ['AP01', 'AP05', 'AP10'], x: 60, y: 430, w: 150, h: 56 },
  { id: 'inspection', labelKey: 'bfNodeInspection', descKey: 'bfNodeInspectionDesc', module: 'IN', screens: ['IN01', 'IN05', 'IN10', 'IN15'], x: 120, y: 520, w: 160, h: 56 },
  { id: 'repairorder', labelKey: 'bfNodeRepairorder', descKey: 'bfNodeRepairorderDesc', module: 'DO', screens: ['DO20'], x: 300, y: 540, w: 150, h: 56 },
  { id: 'handover', labelKey: 'bfNodeHandover', descKey: 'bfNodeHandoverDesc', module: 'DO', screens: ['DO21', 'DO22'], x: 500, y: 540, w: 160, h: 56 },
  { id: 'invoice', labelKey: 'bfNodeInvoice', descKey: 'bfNodeInvoiceDesc', module: 'FA', screens: ['FA01', 'FA05', 'FA10'], x: 460, y: 660, w: 160, h: 64 },
  { id: 'vat', labelKey: 'bfNodeVat', descKey: 'bfNodeVatDesc', module: 'BW', screens: ['BW05', 'BW40'], x: 260, y: 770, w: 140, h: 56 },
  { id: 'purchase', labelKey: 'bfNodePurchase', descKey: 'bfNodePurchaseDesc', module: 'PU', screens: ['PU01', 'PU05'], x: 460, y: 770, w: 140, h: 56 },
  { id: 'bookkeeping', labelKey: 'bfNodeBookkeeping', descKey: 'bfNodeBookkeepingDesc', module: 'BK', screens: ['BK10'], x: 660, y: 770, w: 140, h: 56 },
  { id: 'dashboard', labelKey: 'bfNodeDashboard', descKey: 'bfNodeDashboardDesc', module: 'RP', screens: ['RP01'], x: 700, y: 40, w: 140, h: 56 },
  { id: 'reports', labelKey: 'bfNodeReports', descKey: 'bfNodeReportsDesc', module: 'RP', screens: ['RP10'], x: 700, y: 130, w: 140, h: 56 },
  { id: 'analytics', labelKey: 'bfNodeAnalytics', descKey: 'bfNodeAnalyticsDesc', module: 'SY', screens: ['AN05'], x: 700, y: 210, w: 140, h: 48 },
  { id: 'documents', labelKey: 'bfNodeDocuments', descKey: 'bfNodeDocumentsDesc', module: 'DO', screens: ['DO03', 'DO05'], x: 60, y: 660, w: 150, h: 56 },
  { id: 'notifications', labelKey: 'bfNodeNotifications', descKey: 'bfNodeNotificationsDesc', module: 'SY', screens: ['SY05'], x: 700, y: 290, w: 140, h: 56 },
  { id: 'settings', labelKey: 'bfNodeSettings', descKey: 'bfNodeSettingsDesc', module: 'SY', screens: ['SY01', 'SY02', 'SY03', 'SY06', 'SY10'], x: 60, y: 770, w: 150, h: 56 },
];

const EDGES: FlowEdge[] = [
  { from: 'website', to: 'lead', labelKey: 'bfEdgeFormSubmit' },
  { from: 'walk-in', to: 'lead', labelKey: 'bfEdgeManualEntry' },
  { from: 'lead', to: 'customer', labelKey: 'bfEdgeConvert' },
  { from: 'lead', to: 'vehicle', labelKey: 'bfEdgeConvert' },
  { from: 'lead', to: 'offer', labelKey: 'bfEdgeQuote', style: 'dashed' },
  { from: 'customer', to: 'offer' },
  { from: 'vehicle', to: 'offer' },
  { from: 'customer', to: 'portfolio', style: 'dashed' },
  { from: 'offer', to: 'portfolio', style: 'dashed' },
  { from: 'portfolio', to: 'job', labelKey: 'bfEdgeCreate' },
  { from: 'offer', to: 'job', labelKey: 'bfEdgeApproved' },
  { from: 'job', to: 'parts' },
  { from: 'job', to: 'tasks' },
  { from: 'job', to: 'appointment', style: 'dashed' },
  { from: 'job', to: 'inspection', labelKey: 'bfEdgeInspect' },
  { from: 'job', to: 'repairorder', labelKey: 'bfEdgeApprovedStage' },
  { from: 'job', to: 'handover', labelKey: 'bfEdgeReadyStage' },
  { from: 'inspection', to: 'documents' },
  { from: 'handover', to: 'invoice', labelKey: 'bfEdgeDelivered' },
  { from: 'offer', to: 'invoice', labelKey: 'bfEdgeCreate', style: 'dashed' },
  { from: 'invoice', to: 'vat' },
  { from: 'invoice', to: 'documents' },
  { from: 'purchase', to: 'vat' },
  { from: 'vat', to: 'bookkeeping' },
  { from: 'purchase', to: 'bookkeeping' },
  { from: 'invoice', to: 'bookkeeping', style: 'dashed' },
  { from: 'lead', to: 'dashboard', style: 'dashed' },
  { from: 'job', to: 'dashboard', style: 'dashed' },
  { from: 'invoice', to: 'dashboard', style: 'dashed' },
  { from: 'invoice', to: 'reports', style: 'dashed' },
  { from: 'tasks', to: 'reports', style: 'dashed' },
  { from: 'dashboard', to: 'analytics', style: 'dashed' },
  { from: 'lead', to: 'notifications', style: 'dashed' },
  { from: 'job', to: 'notifications', style: 'dashed' },
  { from: 'invoice', to: 'notifications', style: 'dashed' },
  { from: 'appointment', to: 'notifications', style: 'dashed' },
  { from: 'repairorder', to: 'documents' },
  { from: 'handover', to: 'documents' },
  { from: 'inspection', to: 'handover', style: 'dashed' },
];

/* ── Job pipeline stages ────────────────────────────────────────────── */
const JOB_STAGES = [
  { id: 'intake', labelKey: 'bfStageIntake', color: '#94a3b8' },
  { id: 'quoted', labelKey: 'bfStageQuoted', color: '#fbbf24' },
  { id: 'approved', labelKey: 'bfStageApproved', color: '#4ade80' },
  { id: 'scheduled', labelKey: 'bfStageScheduled', color: '#60a5fa' },
  { id: 'checked_in', labelKey: 'bfStageCheckedIn', color: '#818cf8' },
  { id: 'in_progress', labelKey: 'bfStageInProgress', color: '#22d3ee' },
  { id: 'qc', labelKey: 'bfStageQc', color: '#f472b6' },
  { id: 'ready', labelKey: 'bfStageReady', color: '#34d399' },
  { id: 'delivered', labelKey: 'bfStageDelivered', color: '#a78bfa' },
  { id: 'closed', labelKey: 'bfStageClosed', color: '#6b7280' },
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
  const tSy = useTranslations('sy');
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
          <h2 className="text-base font-medium text-white">{tSy('bfTitle')}</h2>
          <span className="text-[10px] text-[#6b6b80]">{tSy('bfHint')}</span>
        </div>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 900 860" className="w-full min-w-[700px]" style={{ maxHeight: '560px' }}>
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
                  {e.labelKey && isHighlighted && (() => {
                    const pos = getEdgeLabelPos(from, to);
                    return (
                      <text
                        x={pos.x}
                        y={pos.y - 6}
                        textAnchor="middle"
                        className="text-[8px] fill-[#E8364E] font-medium"
                      >
                        {tSy(e.labelKey)}
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
                    {tSy(n.labelKey)}
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
            <h3 className="text-sm font-medium text-white">{tSy(selectedNode.labelKey)}</h3>
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
          <p className="mt-3 text-sm leading-relaxed text-[#6b6b80]">{tSy(selectedNode.descKey)}</p>
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
                  {otherNode && tSy(otherNode.labelKey)}
                  {e.labelKey && <span className="text-[9px] text-[#4a4a5a]">({tSy(e.labelKey)})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Job pipeline detail */}
      <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-5">
        <h2 className="text-base font-medium text-white">{tSy('bfJobPipeline')}</h2>
        <p className="mt-1 text-xs text-[#6b6b80]">{tSy('bfJobPipelineDesc')}</p>
        <div className="mt-4 flex flex-wrap items-center gap-1">
          {JOB_STAGES.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <div
                className="rounded-md border px-3 py-1.5 text-[11px] font-medium"
                style={{ borderColor: s.color + '40', color: s.color, backgroundColor: s.color + '10' }}
              >
                {tSy(s.labelKey)}
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
          <span className="font-medium">↩ {tSy('bfQcLoop')}</span>
          <span className="text-[#6b6b80]">{tSy('bfQcLoopDesc')}</span>
        </div>
      </div>

      {/* State machines grid */}
      <div className="rounded-[10px] border border-[#1e1e2a] bg-[#12121a] p-5">
        <h2 className="text-base font-medium text-white">{tSy('bfStateMachines')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { nameKey: 'bfSmLead', module: 'LD', states: ['new', 'contacted', 'quoted', 'won', 'lost'], terminal: ['won', 'lost'] },
            { nameKey: 'bfSmOffer', module: 'ES', states: ['draft', 'sent', 'approved', 'rejected', 'superseded'], terminal: ['approved', 'rejected', 'superseded'] },
            { nameKey: 'bfSmInvoice', module: 'FA', states: ['draft', 'sent', 'paid', 'overdue', 'credited', 'cancelled'], terminal: ['paid', 'credited', 'cancelled'] },
            { nameKey: 'bfSmPart', module: 'PT', states: ['needed', 'ordered', 'shipped', 'received', 'returned'], terminal: ['received', 'returned'] },
            { nameKey: 'bfSmTask', module: 'TS', states: ['todo', 'in_progress', 'done', 'blocked'], terminal: ['done'] },
            { nameKey: 'bfSmDocument', module: 'DO', states: ['draft', 'issued', 'cancelled'], terminal: ['issued', 'cancelled'] },
            { nameKey: 'bfSmVatReturn', module: 'BW', states: ['open', 'draft', 'filed', 'corrected'], terminal: ['filed'] },
            { nameKey: 'bfSmAppointment', module: 'AP', states: ['requested', 'confirmed', 'completed', 'cancelled'], terminal: ['completed', 'cancelled'] },
            { nameKey: 'bfSmHandover', module: 'DO', states: ['draft', 'issued', 'shared', 'signed'], terminal: ['signed'] },
            { nameKey: 'bfSmInspection', module: 'IN', states: ['requested', 'in_progress', 'completed', 'cancelled'], terminal: ['completed', 'cancelled'] },
            { nameKey: 'bfSmPortfolio', module: 'PF', states: ['open', 'active', 'completed', 'archived'], terminal: ['completed', 'archived'] },
          ].map(sm => {
            const c = MOD_HEX[sm.module] ?? MOD_HEX.SY;
            return (
              <div key={sm.nameKey} className="rounded-lg border border-[#1e1e2a] bg-[#0a0a0f] p-3">
                <div className="flex items-center gap-2">
                  <ScreenBadge code={sm.module} />
                  <span className="text-xs font-medium text-white">{tSy(sm.nameKey)}</span>
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
        <h2 className="text-base font-medium text-white">{tSy('bfModuleMap')}</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { code: 'LD', nameKey: 'bfModLeads', screens: ['LD01', 'LD05', 'LD10'] },
            { code: 'KL', nameKey: 'bfModCustomers', screens: ['KL01', 'KL02', 'KL03', 'KL05'] },
            { code: 'VH', nameKey: 'bfModVehicles', screens: ['VH01', 'VH05', 'VH10'] },
            { code: 'ES', nameKey: 'bfModOffers', screens: ['ES01', 'ES05', 'ES10'] },
            { code: 'PF', nameKey: 'bfModPortfolio', screens: ['PF01', 'PF05', 'PF10'] },
            { code: 'JB', nameKey: 'bfModJobs', screens: ['JB01', 'JB05', 'JB10', 'JB15'] },
            { code: 'PT', nameKey: 'bfModParts', screens: ['PT01', 'PT05'] },
            { code: 'TS', nameKey: 'bfModTasks', screens: ['TS01', 'TS05', 'TS10'] },
            { code: 'FA', nameKey: 'bfModInvoices', screens: ['FA01', 'FA05', 'FA10'] },
            { code: 'DO', nameKey: 'bfModDocuments', screens: ['DO03', 'DO05', 'DO20', 'DO21', 'DO22'] },
            { code: 'AP', nameKey: 'bfModAppointments', screens: ['AP01', 'AP05', 'AP10'] },
            { code: 'IN', nameKey: 'bfModInspections', screens: ['IN01', 'IN05', 'IN10', 'IN15'] },
            { code: 'RP', nameKey: 'bfModReports', screens: ['RP01', 'RP10'] },
            { code: 'BW', nameKey: 'bfModVat', screens: ['BW05', 'BW40'] },
            { code: 'PU', nameKey: 'bfModPurchases', screens: ['PU01', 'PU05'] },
            { code: 'BK', nameKey: 'bfModBookkeeping', screens: ['BK10'] },
            { code: 'SY', nameKey: 'bfModSystem', screens: ['SY01', 'SY02', 'SY03', 'SY05', 'SY06', 'SY10', 'SY15', 'SY20', 'SY25', 'SY30', 'SY35', 'SY40', 'SY45', 'SY50', 'SY55', 'SY60', 'SY65', 'AN05'] },
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
                    <span className="text-xs font-medium text-white">{tSy(m.nameKey)}</span>
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
