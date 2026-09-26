'use client';

import { useTranslations } from 'next-intl';
import { VehicleDamageMap, ZONE_SLOTS } from '@/components/shared/VehicleDamageMap';

/**
 * Public quote form picker: the shared vehicle silhouette with the ten coarse
 * repair locations stored on leads.repair_locations. The same silhouette (with
 * the fine inspection catalog) is used by the inspection wizard, the
 * inspection detail and the vehicle overlay — see VehicleDamageMap.
 */

export const REPAIR_LOCATIONS = [
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

export type RepairLocation = (typeof REPAIR_LOCATIONS)[number];

interface CarDamagePickerProps {
  selected: string[];
  onToggle: (key: string) => void;
}

export default function CarDamagePicker({
  selected,
  onToggle,
}: CarDamagePickerProps) {
  const t = useTranslations('pub.offerte');

  const isSelected = (key: string) => selected.includes(key);

  return (
    <div className="flex flex-col items-center gap-4">
      <VehicleDamageMap
        slots={ZONE_SLOTS}
        selectedKeys={selected}
        onSlotClick={slot => onToggle(slot.keys[0])}
        labelFor={slot => t(`loc_${slot.keys[0]}`)}
        ariaLabel="Car damage picker"
      />

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
