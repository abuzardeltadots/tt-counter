const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generatePairs(availableMembers) {
  // Members arrive sorted by priority (tap order).
  // Last odd player = standby. Rest are paired.
  // Shuffle within groups of 4 to randomize pairings but keep priority tiers.
  // Group 1 (indices 0-3) = first match, Group 2 (4-7) = queue, etc.
  const standby = availableMembers.length % 2 !== 0 ? availableMembers[availableMembers.length - 1] : null;
  const playable = standby ? availableMembers.slice(0, -1) : [...availableMembers];

  // Shuffle within groups of 4 (each group produces 2 pairs)
  const shuffled = [];
  for (let i = 0; i < playable.length; i += 4) {
    const group = playable.slice(i, Math.min(i + 4, playable.length));
    shuffled.push(...shuffle(group));
  }

  const pairs = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    pairs.push({
      id: genId(),
      players: [shuffled[i], shuffled[i + 1]],
      name: `${shuffled[i].name} & ${shuffled[i + 1].name}`
    });
  }
  return { pairs, standby };
}

export function createTournament(availableMembers, targetScore, serveInterval, balancedPairsFn) {
  const result = balancedPairsFn
    ? (() => { const { pairs: bp, standby } = balancedPairsFn(availableMembers); return { pairs: bp.map(([a, b]) => ({ id: genId(), players: [a, b], name: `${a.name} & ${b.name}` })), standby }; })()
    : generatePairs(availableMembers);
  return {
    id: genId(),
    format: 'koth',
    pairs: [...result.pairs],
    matches: [],
    queue: result.pairs.slice(2).map(p => p.id),
    currentChampion: null,
    standby: result.standby,
    pendingPick: null,
    targetScore,
    serveInterval,
    createdAt: Date.now(),
    finishedAt: null
  };
}

export function createRoundRobinTournament(availableMembers, targetScore, serveInterval, balancedPairsFn) {
  const result = balancedPairsFn
    ? (() => { const { pairs: bp, standby } = balancedPairsFn(availableMembers); return { pairs: bp.map(([a, b]) => ({ id: genId(), players: [a, b], name: `${a.name} & ${b.name}` })), standby }; })()
    : generatePairs(availableMembers);
  const matches = [];
  for (let i = 0; i < result.pairs.length; i++) {
    for (let j = i + 1; j < result.pairs.length; j++) {
      matches.push({ id: genId(), pairAId: result.pairs[i].id, pairBId: result.pairs[j].id, scoreA: 0, scoreB: 0, finished: false, winner: null, deuceCount: 0 });
    }
  }
  return {
    id: genId(),
    format: 'roundrobin',
    pairs: [...result.pairs],
    matches,
    bye: result.standby,
    targetScore,
    serveInterval,
    createdAt: Date.now(),
    finishedAt: null
  };
}

export function createKnockoutTournament(availableMembers, targetScore, serveInterval, balancedPairsFn) {
  const result = balancedPairsFn
    ? (() => { const { pairs: bp, standby } = balancedPairsFn(availableMembers); return { pairs: bp.map(([a, b]) => ({ id: genId(), players: [a, b], name: `${a.name} & ${b.name}` })), standby }; })()
    : generatePairs(availableMembers);
  // Seed bracket: first round matches
  const round1 = [];
  for (let i = 0; i < result.pairs.length; i += 2) {
    if (i + 1 < result.pairs.length) {
      round1.push({ id: genId(), pairAId: result.pairs[i].id, pairBId: result.pairs[i + 1].id, scoreA: 0, scoreB: 0, finished: false, winner: null, deuceCount: 0, round: 1 });
    }
  }
  // Bye for odd pair count: last pair auto-advances
  const byePair = result.pairs.length % 2 !== 0 ? result.pairs[result.pairs.length - 1].id : null;
  return {
    id: genId(),
    format: 'knockout',
    pairs: [...result.pairs],
    matches: round1,
    bracket: { rounds: [round1.map(m => m.id)], byePair },
    targetScore,
    serveInterval,
    createdAt: Date.now(),
    finishedAt: null
  };
}

export function advanceKnockoutBracket(t) {
  if (!t || t.format !== 'knockout') return t;
  const currentRound = t.bracket.rounds[t.bracket.rounds.length - 1];
  const currentMatches = currentRound.map(mid => t.matches.find(m => m.id === mid));
  if (!currentMatches.every(m => m?.finished)) return t; // not all done yet

  // Collect winners + current bye (always include bye regardless of round)
  const winners = currentMatches.map(m => m.winner);
  if (t.bracket.byePair) winners.push(t.bracket.byePair);

  if (winners.length <= 1) {
    // Tournament over — last winner is champion
    return { ...t, finishedAt: Date.now(), currentChampion: winners[0] || null };
  }

  // Create next round matches
  const nextRound = [];
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      const m = { id: genId(), pairAId: winners[i], pairBId: winners[i + 1], scoreA: 0, scoreB: 0, finished: false, winner: null, deuceCount: 0, round: t.bracket.rounds.length + 1 };
      nextRound.push(m);
    }
  }
  // Bye for odd winners
  const newBye = winners.length % 2 !== 0 ? winners[winners.length - 1] : null;
  return {
    ...t,
    matches: [...t.matches, ...nextRound],
    bracket: {
      ...t.bracket,
      rounds: [...t.bracket.rounds, nextRound.map(m => m.id)],
      byePair: newBye
    }
  };
}

export function getNextMatch(t) {
  if (!t || t.pendingPick || t.finishedAt) return null;
  if (!t.currentChampion) {
    if (t.pairs.length < 2) return null;
    return { pairA: t.pairs[0], pairB: t.pairs[1] };
  }
  if (t.queue.length === 0) return null;
  const champion = t.pairs.find(p => p.id === t.currentChampion);
  const challenger = t.pairs.find(p => p.id === t.queue[0]);
  if (!champion || !challenger) return null;
  return { pairA: champion, pairB: challenger };
}

export function processMatchResult(t, gameId, scoreA, scoreB, winnerSide, deuceCount) {
  const nm = getNextMatch(t);
  if (!nm) return t;

  const winnerPairId = winnerSide === 'a' ? nm.pairA.id : nm.pairB.id;
  const loserPairId = winnerSide === 'a' ? nm.pairB.id : nm.pairA.id;

  const match = {
    id: gameId || genId(),
    pairAId: nm.pairA.id,
    pairBId: nm.pairB.id,
    scoreA, scoreB,
    finished: true,
    winner: winnerPairId,
    deuceCount: deuceCount || 0
  };

  const matches = [...t.matches, match];
  // First match has no champion yet — queue stays. Otherwise, remove challenger (front of queue).
  const queue = t.currentChampion ? t.queue.slice(1) : [...t.queue];
  const currentChampion = winnerPairId;

  if (t.standby) {
    return {
      ...t, matches, queue, currentChampion,
      pendingPick: { standbyPlayer: t.standby, losingPairId: loserPairId }
    };
  }

  if (queue.length === 0) {
    return { ...t, matches, queue, currentChampion, finishedAt: Date.now() };
  }

  return { ...t, matches, queue, currentChampion };
}

export function processStandbyPick(t, pickedPlayerId) {
  if (!t.pendingPick) return t;
  const { standbyPlayer, losingPairId } = t.pendingPick;
  const losingPair = t.pairs.find(p => p.id === losingPairId);
  if (!losingPair) return t;

  const pickedPlayer = losingPair.players.find(p => p.id === pickedPlayerId);
  const unpickedPlayer = losingPair.players.find(p => p.id !== pickedPlayerId);
  if (!pickedPlayer || !unpickedPlayer) return t;

  const newPair = {
    id: genId(),
    players: [standbyPlayer, pickedPlayer],
    name: `${standbyPlayer.name} & ${pickedPlayer.name}`
  };

  return {
    ...t,
    pairs: [...t.pairs, newPair],
    queue: [...t.queue, newPair.id],
    standby: unpickedPlayer,
    pendingPick: null
  };
}

export function calcStandings(pairs, matches) {
  const stats = {};
  pairs.forEach(p => {
    stats[p.id] = { pairId: p.id, name: p.name, players: p.players, played: 0, won: 0, lost: 0, pf: 0, pa: 0 };
  });
  matches.filter(m => m.finished).forEach(m => {
    if (stats[m.pairAId]) {
      stats[m.pairAId].played++;
      stats[m.pairAId].pf += m.scoreA;
      stats[m.pairAId].pa += m.scoreB;
    }
    if (stats[m.pairBId]) {
      stats[m.pairBId].played++;
      stats[m.pairBId].pf += m.scoreB;
      stats[m.pairBId].pa += m.scoreA;
    }
    if (m.winner === m.pairAId) {
      if (stats[m.pairAId]) stats[m.pairAId].won++;
      if (stats[m.pairBId]) stats[m.pairBId].lost++;
    } else if (m.winner === m.pairBId) {
      if (stats[m.pairBId]) stats[m.pairBId].won++;
      if (stats[m.pairAId]) stats[m.pairAId].lost++;
    }
  });
  return Object.values(stats)
    .filter(s => s.played > 0)
    .sort((a, b) => b.won - a.won || (b.pf - b.pa) - (a.pf - a.pa));
}

export function calcPlayerStats(members, tournaments) {
  const stats = {};
  members.forEach(m => {
    stats[m.id] = { id: m.id, name: m.name, played: 0, won: 0, lost: 0, pf: 0, pa: 0, tournamentWins: 0 };
  });

  tournaments.forEach(t => {
    const pairMap = {};
    t.pairs.forEach(p => { pairMap[p.id] = p.players.map(pl => pl.id); });

    t.matches.filter(m => m.finished).forEach(m => {
      const playersA = pairMap[m.pairAId] || [];
      const playersB = pairMap[m.pairBId] || [];

      playersA.forEach(pid => {
        if (!stats[pid]) return;
        stats[pid].played++;
        stats[pid].pf += m.scoreA;
        stats[pid].pa += m.scoreB;
        if (m.winner === m.pairAId) stats[pid].won++;
        else stats[pid].lost++;
      });

      playersB.forEach(pid => {
        if (!stats[pid]) return;
        stats[pid].played++;
        stats[pid].pf += m.scoreB;
        stats[pid].pa += m.scoreA;
        if (m.winner === m.pairBId) stats[pid].won++;
        else stats[pid].lost++;
      });
    });

    // Dopamine winner credit
    if (t.finishedAt) {
      let champPair = null;
      if (t.currentChampion) {
        champPair = t.pairs.find(p => p.id === t.currentChampion);
      } else if (t.format === 'roundrobin') {
        const st = calcStandings(t.pairs, t.matches);
        if (st.length > 0) champPair = t.pairs.find(p => p.id === st[0].pairId);
      }
      if (champPair) {
        champPair.players.forEach(pl => {
          if (stats[pl.id]) stats[pl.id].tournamentWins++;
        });
      }
    }
  });

  return Object.values(stats)
    .filter(s => s.played > 0)
    .sort((a, b) => b.won - a.won || (b.pf - b.pa) - (a.pf - a.pa));
}
