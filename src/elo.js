const DEFAULT_ELO = 1200;
const K = 32;

export function getAllElo() {
  try { return JSON.parse(localStorage.getItem('tt_elo') || '{}'); }
  catch { return {}; }
}

export function getElo(id) { return getAllElo()[id] || DEFAULT_ELO; }

export function updateElo(winnerIds, loserIds) {
  const data = getAllElo();
  const avgW = winnerIds.reduce((s, id) => s + (data[id] || DEFAULT_ELO), 0) / winnerIds.length;
  const avgL = loserIds.reduce((s, id) => s + (data[id] || DEFAULT_ELO), 0) / loserIds.length;
  const expected = 1 / (1 + Math.pow(10, (avgL - avgW) / 400));
  winnerIds.forEach(id => { data[id] = Math.round((data[id] || DEFAULT_ELO) + K * (1 - expected)); });
  loserIds.forEach(id => { data[id] = Math.round((data[id] || DEFAULT_ELO) + K * (0 - (1 - expected))); });
  localStorage.setItem('tt_elo', JSON.stringify(data));
  return data;
}

export function balancedPairs(members) {
  const sorted = [...members].sort((a, b) => getElo(b.id) - getElo(a.id));
  const pairs = [];
  const half = Math.floor(sorted.length / 2);
  for (let i = 0; i < half; i++) pairs.push([sorted[i], sorted[sorted.length - 1 - i]]);
  const standby = sorted.length % 2 !== 0 ? sorted[half] : null;
  return { pairs, standby };
}

export function getH2H(playerIdsA, playerIdsB, tournaments) {
  let a = 0, b = 0;
  tournaments.forEach(t => {
    t.matches.filter(m => m.finished).forEach(m => {
      const pA = t.pairs.find(p => p.id === m.pairAId);
      const pB = t.pairs.find(p => p.id === m.pairBId);
      if (!pA || !pB) return;
      const aInA = playerIdsA.some(id => pA.players.some(p => p.id === id));
      const bInB = playerIdsB.some(id => pB.players.some(p => p.id === id));
      const aInB = playerIdsA.some(id => pB.players.some(p => p.id === id));
      const bInA = playerIdsB.some(id => pA.players.some(p => p.id === id));
      if (aInA && bInB) { if (m.winner === m.pairAId) a++; else b++; }
      if (aInB && bInA) { if (m.winner === m.pairBId) a++; else b++; }
    });
  });
  return { a, b };
}
