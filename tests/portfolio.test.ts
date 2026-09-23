import { describe, it, expect } from 'vitest';
import {
  categoryFromJobType,
  handlingFromPayerType,
  workItemsFromDescriptions,
  workingDaysBetween,
  suggestTitles,
  publishChecklist,
  canPublish,
} from '@/modules/portfolio/constants';
import { padRegion } from '@/modules/portfolio/plate-detect';
import { pixelGrid } from '@/modules/portfolio/redact';
import { beforeAfterPairs, localized } from '@/modules/portfolio/display';
import { PortfolioProjectInput, RedactionRegion } from '@/modules/portfolio/schema';

describe('work order → dossier mapping', () => {
  it('maps job type to category', () => {
    expect(categoryFromJobType('paint')).toBe('paint');
    expect(categoryFromJobType('bodywork')).toBe('bodywork');
    expect(categoryFromJobType(null)).toBe('bodywork');
  });

  it('maps payer type to handling', () => {
    expect(handlingFromPayerType('casco')).toBe('insurance');
    expect(handlingFromPayerType('wa')).toBe('insurance');
    expect(handlingFromPayerType('particulier')).toBe('private');
    expect(handlingFromPayerType('lease')).toBe('lease');
    expect(handlingFromPayerType(null)).toBeNull();
  });

  it('suggests work items from offer lines', () => {
    expect(workItemsFromDescriptions(['Voorbumper spuiten', 'Deuk linker portier uitdeuken', 'Richtbank uitmeten']))
      .toEqual(['dent_repair', 'straightening_bench', 'bumper_repair']);
    expect(workItemsFromDescriptions(['Auto volledig overspuiten', 'Lak polijsten'])).toEqual(['full_respray', 'polishing']);
    expect(workItemsFromDescriptions([])).toEqual([]);
  });

  it('counts working days excluding weekends', () => {
    // Mon 21 Sep 2026 → Fri 25 Sep 2026
    expect(workingDaysBetween('2026-09-21T08:00:00Z', '2026-09-25T16:00:00Z')).toBe(5);
    // Fri → Mon spans a weekend
    expect(workingDaysBetween('2026-09-25T08:00:00Z', '2026-09-28T16:00:00Z')).toBe(2);
    // Same day, and reversed dates, give at least 1
    expect(workingDaysBetween('2026-09-23T08:00:00Z', '2026-09-23T15:00:00Z')).toBe(1);
    expect(workingDaysBetween('2026-09-25T08:00:00Z', '2026-09-21T08:00:00Z')).toBe(1);
  });

  it('suggests titles in three languages', () => {
    expect(suggestTitles('bodywork', 'BMW 3 Serie')).toEqual({
      nl: 'Schadeherstel BMW 3 Serie', en: 'Body repair BMW 3 Serie', tr: 'Kaporta onarimi BMW 3 Serie',
    });
    expect(suggestTitles('paint', '').nl).toBe('Spuitwerk');
  });
});

describe('publish checklist', () => {
  const ready = {
    title_nl: 'Schadeherstel BMW',
    category: 'bodywork',
    brand_id: 'b1',
    model_free_text: null,
    consent_status: 'received',
    photos: [
      { phase: 'before', redaction_confirmed_at: '2026-09-23T10:00:00Z' },
      { phase: 'after', redaction_confirmed_at: '2026-09-23T10:00:00Z' },
    ],
  };

  it('passes when everything is complete', () => {
    expect(canPublish(ready)).toBe(true);
  });

  it('blocks an unconfirmed photo', () => {
    const p = { ...ready, photos: [...ready.photos, { phase: 'during', redaction_confirmed_at: null }] };
    expect(publishChecklist(p).redaction).toBe(false);
    expect(canPublish(p)).toBe(false);
  });

  it('needs both a before and an after photo', () => {
    expect(publishChecklist({ ...ready, photos: [ready.photos[1]] }).beforeAfter).toBe(false);
  });

  it('needs consent (received or not required)', () => {
    expect(canPublish({ ...ready, consent_status: 'pending' })).toBe(false);
    expect(canPublish({ ...ready, consent_status: 'not_required' })).toBe(true);
  });

  it('accepts a free-text model instead of a brand', () => {
    expect(publishChecklist({ ...ready, brand_id: null, model_free_text: 'Tesla Model 3' }).vehicle).toBe(true);
    expect(publishChecklist({ ...ready, brand_id: null, model_free_text: ' ' }).vehicle).toBe(false);
  });
});

describe('plate redaction', () => {
  it('pads AI boxes and keeps them inside the image', () => {
    const r = padRegion({ x: 0.4, y: 0.6, w: 0.2, h: 0.1 });
    expect(r.x).toBeCloseTo(0.37);
    expect(r.y).toBeCloseTo(0.585);
    expect(r.w).toBeCloseTo(0.26);
    expect(r.h).toBeCloseTo(0.13);
    expect(r.source).toBe('ai');

    const edge = padRegion({ x: 0.9, y: 0.95, w: 0.1, h: 0.05 });
    expect(edge.x + edge.w).toBeLessThanOrEqual(1);
    expect(edge.y + edge.h).toBeLessThanOrEqual(1);
  });

  it('uses a coarse grid so plate characters cannot survive', () => {
    expect(pixelGrid(520, 110)).toEqual({ cols: 6, rows: 2 });
    expect(pixelGrid(100, 400).rows).toBeLessThanOrEqual(12);
  });

  it('rejects regions outside the image', () => {
    expect(RedactionRegion.safeParse({ x: 1.2, y: 0, w: 0.1, h: 0.1 }).success).toBe(false);
  });
});

describe('dossier input validation', () => {
  it('rejects unknown work items and categories', () => {
    expect(PortfolioProjectInput.safeParse({ work_items: ['teleport'] }).success).toBe(false);
    expect(PortfolioProjectInput.safeParse({ category: 'mechanical' }).success).toBe(false);
    expect(PortfolioProjectInput.safeParse({ category: 'paint', work_items: ['pdr'] }).success).toBe(true);
  });
});

describe('public display', () => {
  const photo = (id: string, phase: string, pair: number | null) => ({ id, phase, pair_group: pair, url: `u/${id}` });

  it('pairs before/after photos by pair group', () => {
    const pairs = beforeAfterPairs([photo('a', 'after', 2), photo('b', 'before', 1), photo('c', 'after', 1), photo('d', 'before', 2)]);
    expect(pairs.map(p => [p.before.id, p.after.id])).toEqual([['b', 'c'], ['d', 'a']]);
  });

  it('falls back to the first before + after without groups', () => {
    const pairs = beforeAfterPairs([photo('a', 'before', null), photo('b', 'during', null), photo('c', 'after', null)]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].after.id).toBe('c');
  });

  it('falls back to Dutch text', () => {
    const row = { title_nl: 'Spuitwerk', title_en: '', title_tr: null };
    expect(localized(row, 'title', 'en')).toBe('Spuitwerk');
    expect(localized({ ...row, title_en: 'Paint work' }, 'title', 'en')).toBe('Paint work');
  });
});
