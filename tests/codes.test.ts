import { describe, it, expect } from 'vitest';
import { getScreen, getScreenById, searchScreens } from '@/lib/codes';

describe('Screen registry', () => {
  it('finds a screen by route', () => {
    const screen = getScreen('/app');
    expect(screen).toBeDefined();
    expect(screen!.id).toBe('RP01');
  });

  it('finds a screen by code', () => {
    const screen = getScreenById('JB05');
    expect(screen).toBeDefined();
    expect(screen!.title).toBe('Job List');
  });

  it('searches screens by query', () => {
    const results = searchScreens('Facturen');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('FA05');
  });

  it('returns undefined for unknown route', () => {
    expect(getScreen('/nonexistent')).toBeUndefined();
  });
});
