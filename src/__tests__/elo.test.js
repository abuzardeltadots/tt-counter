import { describe, it, expect, beforeEach } from 'vitest';
import { updateElo, balancedPairs } from '../elo';

// Mock localStorage
const store = {};
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; },
  };
});

describe('updateElo', () => {
  it('winners gain, losers lose', () => {
    const result = updateElo(['p1'], ['p2']);
    expect(result.p1).toBeGreaterThan(1200);
    expect(result.p2).toBeLessThan(1200);
  });
  it('equal ratings shift by ~16 each', () => {
    const result = updateElo(['p1'], ['p2']);
    expect(result.p1).toBe(1216);
    expect(result.p2).toBe(1184);
  });
  it('upset gives more points', () => {
    store.tt_elo = JSON.stringify({ p1: 1000, p2: 1400 });
    const result = updateElo(['p1'], ['p2']);
    const gain = result.p1 - 1000;
    expect(gain).toBeGreaterThan(20); // underdog wins more
  });
});

describe('balancedPairs', () => {
  it('pairs strongest with weakest', () => {
    store.tt_elo = JSON.stringify({ a: 1500, b: 1400, c: 1100, d: 1000 });
    const members = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const { pairs } = balancedPairs(members);
    // Strongest (a:1500) should pair with weakest (d:1000)
    const firstPair = pairs[0].map(p => p.id);
    expect(firstPair).toContain('a');
    expect(firstPair).toContain('d');
  });
  it('handles odd number with standby', () => {
    const members = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
    const { pairs, standby } = balancedPairs(members);
    expect(pairs).toHaveLength(2);
    expect(standby).not.toBeNull();
  });
});
