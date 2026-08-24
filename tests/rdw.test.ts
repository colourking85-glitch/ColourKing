import { describe, it, expect } from 'vitest';
import { rdwToVehicleFields } from '../src/lib/rdw';

describe('rdwToVehicleFields', () => {
  it('maps RDW response to vehicle fields', () => {
    const rdw = {
      kenteken: 'AB123C',
      merk: 'VOLKSWAGEN',
      handelsbenaming: 'GOLF',
      eerste_kleur: 'ZWART',
      brandstof_omschrijving: 'Benzine',
      inrichting: 'hatchback',
      datum_eerste_toelating: '20190315',
      wacht_op_keuring: 'Nee',
    };

    const result = rdwToVehicleFields(rdw);

    expect(result.kenteken).toBe('AB123C');
    expect(result.make).toBe('VOLKSWAGEN');
    expect(result.model).toBe('GOLF');
    expect(result.colour).toBe('ZWART');
    expect(result.fuel).toBe('Benzine');
    expect(result.body_type).toBe('hatchback');
    expect(result.year).toBe(2019);
    expect(result.wok).toBe(false);
    expect(result.rdw_snapshot).toBeDefined();
  });

  it('sets wok true when wacht_op_keuring is Ja', () => {
    const rdw = {
      kenteken: 'XY987Z',
      merk: 'BMW',
      handelsbenaming: '320i',
      eerste_kleur: 'WIT',
      wacht_op_keuring: 'Ja',
    };

    const result = rdwToVehicleFields(rdw);
    expect(result.wok).toBe(true);
  });

  it('handles missing date', () => {
    const rdw = {
      kenteken: 'TEST01',
      merk: 'AUDI',
      handelsbenaming: 'A4',
      eerste_kleur: 'GRIJS',
    };

    const result = rdwToVehicleFields(rdw);
    expect(result.year).toBeUndefined();
  });
});
