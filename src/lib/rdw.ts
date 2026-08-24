const RDW_URL = 'https://opendata.rdw.nl/resource/m9d7-ebf2.json';

export interface RdwVehicle {
  kenteken: string;
  merk: string;
  handelsbenaming: string;
  eerste_kleur: string;
  brandstof_omschrijving?: string;
  inrichting?: string;
  datum_eerste_toelating?: string;
  wacht_op_keuring?: string;
  vervaldatum_apk?: string;
}

export async function lookupKenteken(kenteken: string): Promise<RdwVehicle | null> {
  const clean = kenteken.replace(/[-\s]/g, '').toUpperCase();
  if (!clean || clean.length < 4) return null;

  const res = await fetch(`${RDW_URL}?kenteken=${clean}`);
  if (!res.ok) return null;

  const data: RdwVehicle[] = await res.json();
  if (!data.length) return null;

  return data[0];
}

export function rdwToVehicleFields(rdw: RdwVehicle) {
  const year = rdw.datum_eerste_toelating
    ? parseInt(rdw.datum_eerste_toelating.substring(0, 4), 10)
    : undefined;

  return {
    kenteken: rdw.kenteken,
    make: rdw.merk,
    model: rdw.handelsbenaming,
    colour: rdw.eerste_kleur,
    fuel: rdw.brandstof_omschrijving,
    body_type: rdw.inrichting,
    year: year || undefined,
    wok: rdw.wacht_op_keuring === 'Ja',
    rdw_snapshot: rdw as unknown as Record<string, unknown>,
  };
}
