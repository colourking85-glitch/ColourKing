type PanelSize = 'xs' | 's' | 'm' | 'l' | 'xl';

const BASE_REPAIR: Record<PanelSize, number> = {
  xs: 0.5,
  s: 1.0,
  m: 1.5,
  l: 2.0,
  xl: 3.0,
};

const BASE_PAINT: Record<PanelSize, number> = {
  xs: 0.5,
  s: 1.0,
  m: 1.5,
  l: 2.0,
  xl: 2.5,
};

const SEVERITY_MULTIPLIER: Record<number, number> = {
  1: 0.5,
  2: 1.0,
  3: 1.5,
  4: 2.0,
};

interface SuggestInput {
  panelSize: PanelSize;
  severity: number;
  disposition: string;
  paintRequired: boolean;
  paintOperation?: string | null;
  damageTypes: string[];
}

interface SuggestOutput {
  repairHours: number;
  paintHours: number;
}

export function suggestHours(input: SuggestInput): SuggestOutput {
  if (input.disposition === 'geen_actie' || input.disposition === 'onderzoeken') {
    return { repairHours: 0, paintHours: 0 };
  }

  const mult = SEVERITY_MULTIPLIER[input.severity] ?? 1.0;

  let repairHours = 0;
  if (input.disposition === 'vervangen') {
    repairHours = BASE_REPAIR[input.panelSize] * 1.5;
  } else {
    repairHours = BASE_REPAIR[input.panelSize] * mult;
  }

  let paintHours = 0;
  if (input.paintRequired) {
    const base = BASE_PAINT[input.panelSize];
    switch (input.paintOperation) {
      case 'spot':
        paintHours = base * 0.5;
        break;
      case 'polijsten':
        paintHours = base * 0.3;
        break;
      case 'paneel':
        paintHours = base;
        break;
      case 'inspuiten':
        paintHours = base * 1.2;
        break;
      default:
        paintHours = base;
    }
  }

  return {
    repairHours: Math.round(repairHours * 4) / 4,
    paintHours: Math.round(paintHours * 4) / 4,
  };
}
