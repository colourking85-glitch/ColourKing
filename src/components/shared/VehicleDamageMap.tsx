'use client';

import { useRef } from 'react';

/**
 * One top-down vehicle silhouette for the whole system.
 *
 * - Public quote form: `ZONE_SLOTS` (10 coarse repair locations stored on leads).
 * - Inspection wizard / detail / vehicle overlay: `COMPONENT_SLOTS`, each slot
 *   listing one or more `ins_components.key` values that share that area
 *   (e.g. a door slot holds the door panel, its glass and its trim).
 *
 * Coordinate contract: `ins_findings.hotspot_point` is `{ x, y }` normalised
 * to 0..1 inside this SVG's viewBox (300 x 500, front of the car at the top).
 */

export const MAP_VIEWBOX = { w: 300, h: 500 } as const;

export type MapPoint = { x: number; y: number };

export type MapSlot = {
  id: string;
  /** SVG path in viewBox units */
  d: string;
  /** label anchor in viewBox units */
  label: [number, number];
  /** keys this area represents; one slot may cover several catalog keys */
  keys: string[];
};

export type MapMarker = {
  id: string;
  point: MapPoint;
  label: string;
  /** dimmed marker (e.g. pre-existing damage) */
  muted?: boolean;
  active?: boolean;
};

const rect = (x1: number, y1: number, x2: number, y2: number) =>
  `M${x1},${y1} L${x2},${y1} L${x2},${y2} L${x1},${y2} Z`;
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0 Z`;
/** mirror an x coordinate across the centre line */
const mx = (x: number) => MAP_VIEWBOX.w - x;

// ── Coarse zones (public quote form, leads.repair_locations) ──
export const ZONE_SLOTS: MapSlot[] = [
  { id: 'front_bumper', keys: ['front_bumper'], label: [150, 45], d: 'M100,50 Q100,30 150,25 Q200,30 200,50 L195,60 Q150,55 105,60 Z' },
  { id: 'hood', keys: ['hood'], label: [150, 112], d: 'M105,60 Q150,55 195,60 L200,160 Q150,155 100,160 Z' },
  { id: 'fender', keys: ['fender'], label: [85, 112], d: 'M70,70 L100,60 L100,160 L70,155 Z' },
  { id: 'roof', keys: ['roof'], label: [150, 255], d: 'M100,195 Q150,190 200,195 L200,310 Q150,305 100,310 Z' },
  { id: 'left_side', keys: ['left_side'], label: [45, 250], d: 'M60,80 L70,70 L70,155 L65,165 L60,195 L60,310 L65,340 L70,350 L70,430 L60,420 Q55,250 60,80 Z' },
  { id: 'right_side', keys: ['right_side'], label: [255, 250], d: 'M240,80 L230,70 L230,155 L235,165 L240,195 L240,310 L235,340 L230,350 L230,430 L240,420 Q245,250 240,80 Z' },
  { id: 'door', keys: ['door'], label: [150, 178], d: 'M70,160 L100,160 Q150,155 200,160 L230,160 L235,165 L240,195 L200,195 Q150,190 100,195 L60,195 L65,165 Z M70,310 L100,310 Q150,305 200,310 L230,310 L235,340 L240,350 L200,350 Q150,345 100,350 L60,350 L65,340 Z' },
  { id: 'trunk', keys: ['trunk'], label: [150, 395], d: 'M100,350 Q150,345 200,350 L200,440 Q150,445 100,440 Z' },
  { id: 'rear_bumper', keys: ['rear_bumper'], label: [150, 460], d: 'M105,440 Q150,445 195,440 L200,450 Q200,470 150,475 Q100,470 100,450 Z' },
];

// ── Fine slots (inspection catalog, ins_components.key) ──
// Order matters: later slots render on top, so small parts come after big panels.
export const COMPONENT_SLOTS: MapSlot[] = [
  // big panels
  { id: 'bumper_front', keys: ['bumper_front', 'front_panel'], label: [150, 52], d: 'M100,50 Q100,30 150,25 Q200,30 200,50 L195,60 Q150,55 105,60 Z' },
  { id: 'bonnet', keys: ['bonnet'], label: [150, 110], d: 'M105,60 Q150,55 195,60 L200,158 Q150,153 100,158 Z' },
  { id: 'wiper_front', keys: ['wiper_front'], label: [150, 164], d: 'M100,158 Q150,153 200,158 L200,170 Q150,165 100,170 Z' },
  { id: 'windscreen', keys: ['windscreen', 'dashboard'], label: [150, 186], d: 'M100,170 Q150,165 200,170 L200,202 Q150,197 100,202 Z' },
  { id: 'roof', keys: ['roof', 'seat_fl', 'seat_fr'], label: [150, 255], d: 'M104,202 Q150,197 196,202 L196,305 Q150,300 104,305 Z' },
  { id: 'roof_rail_l', keys: ['roof_rail_l'], label: [100, 255], d: rect(96, 202, 104, 305) },
  { id: 'roof_rail_r', keys: ['roof_rail_r'], label: [200, 255], d: rect(196, 202, 204, 305) },
  { id: 'rear_screen', keys: ['rear_screen'], label: [150, 325], d: 'M100,305 Q150,300 200,305 L200,345 Q150,340 100,345 Z' },
  { id: 'boot', keys: ['boot_lid', 'tailgate'], label: [150, 392], d: 'M100,345 Q150,340 200,345 L200,438 Q150,443 100,438 Z' },
  { id: 'rear_panel', keys: ['rear_panel'], label: [150, 444], d: 'M100,438 Q150,443 200,438 L200,450 Q150,455 100,450 Z' },
  { id: 'bumper_rear', keys: ['bumper_rear'], label: [150, 465], d: 'M100,450 Q150,455 200,450 Q200,470 150,475 Q100,470 100,450 Z' },
  // left side (driver side, viewer's left)
  { id: 'fender_fl', keys: ['fender_fl'], label: [85, 110], d: 'M70,70 L100,60 L100,158 L70,153 Z' },
  { id: 'door_fl', keys: ['door_fl', 'door_glass_fl', 'trim_door_fl'], label: [80, 205], d: 'M62,160 L100,158 L100,250 L60,250 L62,200 Z' },
  { id: 'door_rl', keys: ['door_rl', 'slide_door_l', 'door_glass_rl'], label: [80, 295], d: rect(60, 250, 100, 340) },
  { id: 'quarter_l', keys: ['quarter_l', 'quarter_glass_l'], label: [82, 385], d: 'M60,340 L100,340 L100,438 L70,430 L62,410 Z' },
  { id: 'sill_l', keys: ['sill_l'], label: [56, 300], d: rect(52, 165, 60, 335) },
  // right side
  { id: 'fender_fr', keys: ['fender_fr'], label: [215, 110], d: 'M230,70 L200,60 L200,158 L230,153 Z' },
  { id: 'door_fr', keys: ['door_fr', 'door_glass_fr', 'trim_door_fr'], label: [220, 205], d: 'M238,160 L200,158 L200,250 L240,250 L238,200 Z' },
  { id: 'door_rr', keys: ['door_rr', 'slide_door_r', 'door_glass_rr'], label: [220, 295], d: rect(200, 250, 240, 340) },
  { id: 'quarter_r', keys: ['quarter_r', 'quarter_glass_r'], label: [218, 385], d: 'M240,340 L200,340 L200,438 L230,430 L238,410 Z' },
  { id: 'sill_r', keys: ['sill_r'], label: [244, 300], d: rect(240, 165, 248, 335) },
  // small parts on top
  { id: 'grille', keys: ['grille'], label: [150, 40], d: rect(128, 32, 172, 48) },
  { id: 'headlamp_l', keys: ['headlamp_l', 'fog_l'], label: [110, 46], d: rect(98, 36, 122, 56) },
  { id: 'headlamp_r', keys: ['headlamp_r', 'fog_r'], label: [190, 46], d: rect(mx(122), 36, mx(98), 56) },
  { id: 'taillamp_l', keys: ['taillamp_l'], label: [110, 452], d: rect(98, 442, 122, 462) },
  { id: 'taillamp_r', keys: ['taillamp_r'], label: [190, 452], d: rect(mx(122), 442, mx(98), 462) },
  { id: 'mirror_l', keys: ['mirror_l'], label: [52, 155], d: ellipse(52, 155, 9, 6) },
  { id: 'mirror_r', keys: ['mirror_r'], label: [248, 155], d: ellipse(248, 155, 9, 6) },
  { id: 'wheel_fl', keys: ['wheel_fl', 'tyre_fl'], label: [68, 95], d: ellipse(68, 95, 12, 20) },
  { id: 'wheel_fr', keys: ['wheel_fr', 'tyre_fr'], label: [232, 95], d: ellipse(232, 95, 12, 20) },
  { id: 'wheel_rl', keys: ['wheel_rl', 'tyre_rl'], label: [68, 405], d: ellipse(68, 405, 12, 20) },
  { id: 'wheel_rr', keys: ['wheel_rr', 'tyre_rr'], label: [232, 405], d: ellipse(232, 405, 12, 20) },
];

/** Coarse public zone -> inspection catalog keys (to seed findings from a lead). */
export const ZONE_TO_COMPONENTS: Record<string, string[]> = {
  front_bumper: ['bumper_front', 'grille', 'headlamp_l', 'headlamp_r', 'fog_l', 'fog_r', 'front_panel'],
  rear_bumper: ['bumper_rear', 'rear_panel', 'taillamp_l', 'taillamp_r'],
  hood: ['bonnet', 'wiper_front', 'windscreen'],
  roof: ['roof', 'roof_rail_l', 'roof_rail_r'],
  left_side: ['sill_l', 'quarter_l', 'quarter_glass_l', 'mirror_l'],
  right_side: ['sill_r', 'quarter_r', 'quarter_glass_r', 'mirror_r'],
  trunk: ['boot_lid', 'tailgate', 'rear_screen'],
  fender: ['fender_fl', 'fender_fr'],
  door: ['door_fl', 'door_fr', 'door_rl', 'door_rr', 'slide_door_l', 'slide_door_r', 'door_glass_fl', 'door_glass_fr', 'door_glass_rl', 'door_glass_rr'],
  other: [],
};

export function slotForKey(slots: MapSlot[], key: string): MapSlot | undefined {
  return slots.find(s => s.keys.includes(key));
}

/** Fallback marker position for a finding without a stored hotspot. */
export function defaultPointForKey(key: string): MapPoint | null {
  const slot = slotForKey(COMPONENT_SLOTS, key);
  if (!slot) return null;
  return { x: slot.label[0] / MAP_VIEWBOX.w, y: slot.label[1] / MAP_VIEWBOX.h };
}

type Props = {
  slots: MapSlot[];
  /** slots containing any of these keys are drawn as selected */
  selectedKeys?: string[];
  markers?: MapMarker[];
  onSlotClick?: (slot: MapSlot, point: MapPoint) => void;
  onMarkerClick?: (id: string) => void;
  /** label for a slot (defaults to the first key) */
  labelFor?: (slot: MapSlot) => string;
  showLabels?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function VehicleDamageMap({
  slots,
  selectedKeys = [],
  markers = [],
  onSlotClick,
  onMarkerClick,
  labelFor,
  showLabels = true,
  className = 'w-full max-w-[300px]',
  ariaLabel = 'Vehicle damage map',
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const interactive = !!onSlotClick;

  function toPoint(e: React.MouseEvent | React.KeyboardEvent, slot: MapSlot): MapPoint {
    const svg = svgRef.current;
    if (svg && 'clientX' in e) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const local = pt.matrixTransform(ctm.inverse());
        return {
          x: Math.min(1, Math.max(0, local.x / MAP_VIEWBOX.w)),
          y: Math.min(1, Math.max(0, local.y / MAP_VIEWBOX.h)),
        };
      }
    }
    return { x: slot.label[0] / MAP_VIEWBOX.w, y: slot.label[1] / MAP_VIEWBOX.h };
  }

  const isSelected = (slot: MapSlot) => slot.keys.some(k => selectedKeys.includes(k));

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
    >
      {/* body outline */}
      <path
        d="M150,22 Q105,22 95,40 L60,80 Q52,120 52,250 Q52,380 60,420 L95,460 Q105,478 150,478 Q195,478 205,460 L240,420 Q248,380 248,250 Q248,120 240,80 L205,40 Q195,22 150,22 Z"
        fill="var(--ck-surface-2, rgba(255,255,255,0.02))"
        stroke="var(--ck-border-2, #2b2d33)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <line x1="150" y1="30" x2="150" y2="470" stroke="var(--ck-border, #26272c)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.4" />
      {/* front marker */}
      <text x="150" y="16" textAnchor="middle" fontSize="8" fill="var(--ck-text-muted, #71717a)" className="select-none">▲</text>

      {slots.map(slot => {
        const sel = isSelected(slot);
        const label = labelFor ? labelFor(slot) : slot.keys[0];
        return (
          <g
            key={slot.id}
            onClick={interactive ? e => onSlotClick?.(slot, toPoint(e, slot)) : undefined}
            onKeyDown={interactive ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSlotClick?.(slot, toPoint(e, slot));
              }
            } : undefined}
            className={interactive ? 'cursor-pointer' : undefined}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={label}
            aria-pressed={interactive ? sel : undefined}
          >
            <path
              d={slot.d}
              fill={sel ? 'rgba(225, 29, 72, 0.22)' : 'transparent'}
              stroke={sel ? 'var(--ck-accent, #e11d48)' : 'var(--ck-border, #26272c)'}
              strokeWidth={sel ? 2 : 1}
              className={interactive ? 'transition-all duration-150 hover:stroke-[var(--ck-accent,#e11d48)] hover:stroke-[1.5] hover:fill-[rgba(225,29,72,0.08)]' : undefined}
            />
            {showLabels && (
              <text
                x={slot.label[0]}
                y={slot.label[1]}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={slots === ZONE_SLOTS ? 9 : 6.5}
                fill={sel ? 'var(--ck-accent, #e11d48)' : 'var(--ck-text-muted, #71717a)'}
                className="pointer-events-none select-none"
                fontFamily="var(--font-inter, Inter, system-ui, sans-serif)"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}

      {markers.map(m => {
        const cx = m.point.x * MAP_VIEWBOX.w;
        const cy = m.point.y * MAP_VIEWBOX.h;
        const fill = m.muted ? 'var(--ck-text-muted, #71717a)' : 'var(--ck-accent, #e11d48)';
        return (
          <g
            key={m.id}
            onClick={onMarkerClick ? e => { e.stopPropagation(); onMarkerClick(m.id); } : undefined}
            className={onMarkerClick ? 'cursor-pointer' : undefined}
            role={onMarkerClick ? 'button' : undefined}
            aria-label={m.label}
          >
            <circle cx={cx} cy={cy} r={m.active ? 11 : 9} fill={fill} stroke="#fff" strokeWidth={m.active ? 2 : 1.2} opacity={m.muted ? 0.75 : 1} />
            <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fontWeight="700" fill="#fff" className="pointer-events-none select-none" fontFamily="ui-monospace, monospace">
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
