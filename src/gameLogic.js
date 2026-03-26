export function calcServe(scoreA, scoreB, targetScore, serveInterval) {
  const tot = scoreA + scoreB;
  if (scoreA >= targetScore - 1 && scoreB >= targetScore - 1) return tot % 2 === 0 ? 'a' : 'b';
  return (Math.floor(tot / serveInterval) % 2 === 0) ? 'a' : 'b';
}

export function calcServeRemaining(scoreA, scoreB, targetScore, serveInterval) {
  if (scoreA >= targetScore - 1 && scoreB >= targetScore - 1) return 1;
  return serveInterval - ((scoreA + scoreB) % serveInterval);
}

export function isDeuce(scoreA, scoreB, targetScore) {
  return scoreA >= targetScore - 1 && scoreB >= targetScore - 1 && scoreA === scoreB;
}

export function getWinner(scoreA, scoreB, targetScore) {
  const max = Math.max(scoreA, scoreB);
  if (max < targetScore) return null;
  if (max - Math.min(scoreA, scoreB) >= 2) return scoreA > scoreB ? 'a' : 'b';
  return null;
}

export function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
