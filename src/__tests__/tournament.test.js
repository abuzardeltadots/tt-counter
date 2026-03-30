import { describe, it, expect } from 'vitest';
import { generatePairs, createTournament, createRoundRobinTournament, getNextMatch, processMatchResult, processStandbyPick, calcStandings } from '../tournament';

const makePlayers = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `Player${i}` }));

describe('generatePairs', () => {
  it('creates correct number of pairs for even', () => {
    const { pairs, standby } = generatePairs(makePlayers(6));
    expect(pairs).toHaveLength(3);
    expect(standby).toBeNull();
  });
  it('creates standby for odd', () => {
    const { pairs, standby } = generatePairs(makePlayers(7));
    expect(pairs).toHaveLength(3);
    expect(standby).not.toBeNull();
  });
  it('each pair has 2 players', () => {
    const { pairs } = generatePairs(makePlayers(8));
    pairs.forEach(p => expect(p.players).toHaveLength(2));
  });
});

describe('KOTH tournament', () => {
  it('creates tournament with queue', () => {
    const t = createTournament(makePlayers(8), 21, 2);
    expect(t.format).toBe('koth');
    expect(t.pairs).toHaveLength(4);
    expect(t.queue).toHaveLength(2);
    expect(t.currentChampion).toBeNull();
  });
  it('first match is pairs[0] vs pairs[1]', () => {
    const t = createTournament(makePlayers(6), 21, 2);
    const nm = getNextMatch(t);
    expect(nm.pairA.id).toBe(t.pairs[0].id);
    expect(nm.pairB.id).toBe(t.pairs[1].id);
  });
  it('processMatchResult sets champion and triggers pick for odd', () => {
    const t = createTournament(makePlayers(5), 21, 2);
    const result = processMatchResult(t, 'g1', 21, 15, 'a', 0);
    expect(result.currentChampion).toBe(t.pairs[0].id);
    expect(result.pendingPick).not.toBeNull();
    expect(result.pendingPick.standbyPlayer).toBeTruthy();
  });
  it('processStandbyPick creates new pair and sets standby', () => {
    const t = createTournament(makePlayers(5), 21, 2);
    const after1 = processMatchResult(t, 'g1', 21, 15, 'a', 0);
    const losingPair = after1.pairs.find(p => p.id === after1.pendingPick.losingPairId);
    const picked = losingPair.players[0];
    const after2 = processStandbyPick(after1, picked.id);
    expect(after2.pendingPick).toBeNull();
    expect(after2.standby).toBeTruthy();
    expect(after2.standby.id).not.toBe(picked.id);
    expect(after2.queue.length).toBeGreaterThan(0);
  });
  it('even tournament finishes when queue empty', () => {
    const players = makePlayers(4);
    const t = createTournament(players, 21, 2);
    // Only 2 pairs, queue is empty, first match finishes tournament
    const result = processMatchResult(t, 'g1', 21, 10, 'a', 0);
    expect(result.finishedAt).toBeTruthy();
    expect(result.currentChampion).toBeTruthy();
  });
});

describe('Round Robin tournament', () => {
  it('creates all pair matchups', () => {
    const t = createRoundRobinTournament(makePlayers(6), 21, 2);
    expect(t.format).toBe('roundrobin');
    expect(t.pairs).toHaveLength(3);
    expect(t.matches).toHaveLength(3); // C(3,2) = 3
  });
  it('6 pairs = 15 matches', () => {
    const t = createRoundRobinTournament(makePlayers(12), 11, 2);
    expect(t.pairs).toHaveLength(6);
    expect(t.matches).toHaveLength(15); // C(6,2) = 15
  });
});

describe('calcStandings', () => {
  it('sorts by wins then point differential', () => {
    const pairs = [
      { id: 'a', name: 'A', players: [] },
      { id: 'b', name: 'B', players: [] },
    ];
    const matches = [
      { pairAId: 'a', pairBId: 'b', scoreA: 21, scoreB: 15, finished: true, winner: 'a' },
    ];
    const s = calcStandings(pairs, matches);
    expect(s[0].pairId).toBe('a');
    expect(s[0].won).toBe(1);
    expect(s[1].pairId).toBe('b');
    expect(s[1].lost).toBe(1);
  });
});
