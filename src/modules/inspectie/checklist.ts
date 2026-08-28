export type ShotKey =
  | 'front' | 'front_left' | 'left' | 'rear_left'
  | 'rear' | 'rear_right' | 'right' | 'front_right'
  | 'roof' | 'dashboard' | 'odometer' | 'vin_plate';

export interface GuidedShot {
  key: ShotKey;
  label: { nl: string; en: string; tr: string };
  required: boolean;
}

export const GUIDED_SHOTS: GuidedShot[] = [
  { key: 'front',       label: { nl: 'Voorzijde',           en: 'Front',             tr: 'Ön Taraf' },       required: true },
  { key: 'front_left',  label: { nl: 'Linksvoor',           en: 'Front Left',        tr: 'Sol Ön' },         required: true },
  { key: 'left',        label: { nl: 'Linkerzijde',         en: 'Left Side',         tr: 'Sol Taraf' },      required: true },
  { key: 'rear_left',   label: { nl: 'Linksachter',         en: 'Rear Left',         tr: 'Sol Arka' },       required: true },
  { key: 'rear',        label: { nl: 'Achterzijde',         en: 'Rear',              tr: 'Arka Taraf' },     required: true },
  { key: 'rear_right',  label: { nl: 'Rechtsachter',        en: 'Rear Right',        tr: 'Sağ Arka' },       required: true },
  { key: 'right',       label: { nl: 'Rechterzijde',        en: 'Right Side',        tr: 'Sağ Taraf' },      required: true },
  { key: 'front_right', label: { nl: 'Rechtsvoor',          en: 'Front Right',       tr: 'Sağ Ön' },         required: true },
  { key: 'roof',        label: { nl: 'Dak',                 en: 'Roof',              tr: 'Tavan' },           required: false },
  { key: 'dashboard',   label: { nl: 'Dashboard',           en: 'Dashboard',         tr: 'Gösterge Paneli' }, required: false },
  { key: 'odometer',    label: { nl: 'Kilometerstand',      en: 'Odometer',          tr: 'Kilometre' },      required: true },
  { key: 'vin_plate',   label: { nl: 'VIN plaatje',         en: 'VIN Plate',         tr: 'VIN Plakası' },    required: false },
];

export function getMissingShotsForSubmit(capturedKeys: string[]): GuidedShot[] {
  return GUIDED_SHOTS.filter(s => s.required && !capturedKeys.includes(s.key));
}

export function getShotProgress(capturedKeys: string[]): { done: number; total: number; pct: number } {
  const required = GUIDED_SHOTS.filter(s => s.required);
  const done = required.filter(s => capturedKeys.includes(s.key)).length;
  return { done, total: required.length, pct: Math.round((done / required.length) * 100) };
}
