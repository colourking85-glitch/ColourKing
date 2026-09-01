'use client';

import { useTranslations } from 'next-intl';

const REPAIR_LOCATIONS = [
  'front_bumper',
  'rear_bumper',
  'hood',
  'roof',
  'left_side',
  'right_side',
  'trunk',
  'fender',
  'door',
  'other',
] as const;

type RepairLocation = (typeof REPAIR_LOCATIONS)[number];

interface CarDamagePickerProps {
  selected: string[];
  onToggle: (key: string) => void;
}

/**
 * Zone geometry for the top-down sedan SVG.
 * viewBox is 300 x 500. The car body spans roughly x:60–240, y:30–470.
 *
 * Layout (top = front of car):
 *   front_bumper  – top strip
 *   hood          – front panel
 *   fender        – two narrow strips flanking the hood
 *   left_side     – full left body rail
 *   right_side    – full right body rail
 *   door          – centre side panels (wider area left+right)
 *   roof          – centre top panel
 *   trunk         – rear panel
 *   rear_bumper   – bottom strip
 */

interface ZoneDef {
  key: RepairLocation;
  /** SVG path "d" attribute */
  d: string;
  /** Label position [x, y] */
  label: [number, number];
}

const ZONES: ZoneDef[] = [
  // Front bumper — curved strip across the front
  {
    key: 'front_bumper',
    d: 'M100,50 Q100,30 150,25 Q200,30 200,50 L195,60 Q150,55 105,60 Z',
    label: [150, 45],
  },
  // Hood — large trapezoidal panel behind bumper
  {
    key: 'hood',
    d: 'M105,60 Q150,55 195,60 L200,160 Q150,155 100,160 Z',
    label: [150, 112],
  },
  // Left fender — narrow strip on driver side, front
  {
    key: 'fender',
    d: 'M70,70 L100,60 L100,160 L70,155 Z',
    label: [85, 112],
  },
  // Roof — large centre panel
  {
    key: 'roof',
    d: 'M100,195 Q150,190 200,195 L200,310 Q150,305 100,310 Z',
    label: [150, 255],
  },
  // Left side — full length rail
  {
    key: 'left_side',
    d: 'M60,80 L70,70 L70,155 L65,165 L60,195 L60,310 L65,340 L70,350 L70,430 L60,420 Q55,250 60,80 Z',
    label: [45, 250],
  },
  // Right side — full length rail (mirrored)
  {
    key: 'right_side',
    d: 'M240,80 L230,70 L230,155 L235,165 L240,195 L240,310 L235,340 L230,350 L230,430 L240,420 Q245,250 240,80 Z',
    label: [255, 250],
  },
  // Door — left and right panels between fender/roof area
  {
    key: 'door',
    d: 'M70,160 L100,160 Q150,155 200,160 L230,160 L235,165 L240,195 L200,195 Q150,190 100,195 L60,195 L65,165 Z M70,310 L100,310 Q150,305 200,310 L230,310 L235,340 L240,350 L200,350 Q150,345 100,350 L60,350 L65,340 Z',
    label: [150, 178],
  },
  // Trunk — rear panel
  {
    key: 'trunk',
    d: 'M100,350 Q150,345 200,350 L200,440 Q150,445 100,440 Z',
    label: [150, 395],
  },
  // Rear bumper — curved strip at the back
  {
    key: 'rear_bumper',
    d: 'M105,440 Q150,445 195,440 L200,450 Q200,470 150,475 Q100,470 100,450 Z',
    label: [150, 460],
  },
];

export default function CarDamagePicker({
  selected,
  onToggle,
}: CarDamagePickerProps) {
  const t = useTranslations('pub.offerte');

  const isSelected = (key: string) => selected.includes(key);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* SVG car diagram */}
      <svg
        viewBox="0 0 300 500"
        className="w-full max-w-[300px]"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Car damage picker"
      >
        {/* Car body outline for context — a smooth sedan silhouette */}
        <path
          d="M150,22 Q105,22 95,40 L60,80 Q52,120 52,250 Q52,380 60,420 L95,460 Q105,478 150,478 Q195,478 205,460 L240,420 Q248,380 248,250 Q248,120 240,80 L205,40 Q195,22 150,22 Z"
          fill="none"
          stroke="var(--ck-border-2, #2b2d33)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Windshield lines */}
        <line
          x1="100"
          y1="160"
          x2="200"
          y2="160"
          stroke="var(--ck-border-2, #2b2d33)"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="100"
          y1="195"
          x2="200"
          y2="195"
          stroke="var(--ck-border-2, #2b2d33)"
          strokeWidth="1"
          opacity="0.5"
        />
        {/* Rear window lines */}
        <line
          x1="100"
          y1="310"
          x2="200"
          y2="310"
          stroke="var(--ck-border-2, #2b2d33)"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="100"
          y1="350"
          x2="200"
          y2="350"
          stroke="var(--ck-border-2, #2b2d33)"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Centre line */}
        <line
          x1="150"
          y1="30"
          x2="150"
          y2="470"
          stroke="var(--ck-border, #26272c)"
          strokeWidth="0.5"
          strokeDasharray="4 4"
          opacity="0.4"
        />

        {/* Wing mirror left */}
        <ellipse
          cx="52"
          cy="155"
          rx="8"
          ry="5"
          fill="none"
          stroke="var(--ck-border-2, #2b2d33)"
          strokeWidth="1.5"
        />
        {/* Wing mirror right */}
        <ellipse
          cx="248"
          cy="155"
          rx="8"
          ry="5"
          fill="none"
          stroke="var(--ck-border-2, #2b2d33)"
          strokeWidth="1.5"
        />

        {/* Wheel indicators */}
        {[
          [68, 95, 12, 20],
          [232, 95, 12, 20],
          [68, 405, 12, 20],
          [232, 405, 12, 20],
        ].map(([cx, cy, rx, ry], i) => (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill="var(--ck-surface-2, #1c1e23)"
            stroke="var(--ck-border-2, #2b2d33)"
            strokeWidth="1.5"
          />
        ))}

        {/* Clickable zones */}
        {ZONES.map((zone) => {
          const sel = isSelected(zone.key);
          return (
            <g
              key={zone.key}
              onClick={() => onToggle(zone.key)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={t(`loc_${zone.key}`)}
              aria-pressed={sel}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle(zone.key);
                }
              }}
            >
              <path
                d={zone.d}
                fill={sel ? 'rgba(225, 29, 72, 0.2)' : 'transparent'}
                stroke={
                  sel
                    ? 'var(--ck-accent, #e11d48)'
                    : 'var(--ck-border, #26272c)'
                }
                strokeWidth={sel ? '2' : '1'}
                className="transition-all duration-150 hover:stroke-[var(--ck-accent,#e11d48)] hover:stroke-[1.5]"
              />
              <text
                x={zone.label[0]}
                y={zone.label[1]}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill={
                  sel
                    ? 'var(--ck-accent, #e11d48)'
                    : 'var(--ck-text-muted, #71717a)'
                }
                className="pointer-events-none select-none"
                fontFamily="var(--font-inter, Inter, system-ui, sans-serif)"
              >
                {t(`loc_${zone.key}`)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* "Other" toggle — outside the SVG */}
      <button
        type="button"
        onClick={() => onToggle('other')}
        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
          isSelected('other')
            ? 'border-ck-red bg-ck-red-bg text-ck-red-text'
            : 'border-ck-border text-ck-text-muted hover:border-ck-red hover:text-ck-text-2'
        }`}
      >
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded border text-xs ${
            isSelected('other')
              ? 'border-ck-red bg-ck-red text-white'
              : 'border-ck-border'
          }`}
        >
          {isSelected('other') && '✓'}
        </span>
        {t('loc_other')}
      </button>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {selected.map((key) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 rounded-full border border-ck-red-border bg-ck-red-bg px-2.5 py-0.5 text-xs text-ck-red-text"
            >
              {t(`loc_${key}`)}
              <button
                type="button"
                onClick={() => onToggle(key)}
                className="ml-0.5 text-ck-red-text/60 hover:text-ck-red-text"
                aria-label={`Remove ${t(`loc_${key}`)}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
