// --- Sync via URL ---
export function createSyncUrl(tournament, members) {
  const data = { v: 1, t: tournament, m: members };
  const json = JSON.stringify(data);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return `${window.location.origin}${window.location.pathname}#sync=${encoded}`;
}

export function parseSyncHash() {
  const hash = window.location.hash;
  if (!hash.startsWith('#sync=')) return null;
  try {
    const encoded = hash.slice(6);
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch { return null; }
}

export function clearSyncHash() {
  history.replaceState(null, '', window.location.pathname);
}

export async function shareSyncUrl(url) {
  if (navigator.share) {
    try { await navigator.share({ title: 'TT Counter - Sync Scores', url }); return true; }
    catch { /* cancelled */ }
  }
  if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(url); return 'copied'; }
    catch { /* denied */ }
  }
  return false;
}

// --- Screenshot sharing ---
function truncText(ctx, text, maxW) {
  let t = text;
  while (ctx.measureText(t).width > maxW && t.length > 4) t = t.slice(0, -4) + '\u2026';
  return t;
}

export function renderResultsCard(tournament, standings, championPair) {
  const W = 720, pad = 32, rowH = 34;
  const matchCount = Math.min(tournament.matches.length, 12);
  const H = 240 + standings.length * rowH + 40 + matchCount * 30 + 60;

  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const font = (w, s) => `${w} ${s}px system-ui, -apple-system, sans-serif`;

  // Background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, W, H);

  // Top accent line
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#ff6b35'); grad.addColorStop(1, '#00d4ff');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, 4);

  let y = 44;

  // Title
  ctx.fillStyle = '#ffd700'; ctx.font = font('900', 26); ctx.textAlign = 'center';
  ctx.fillText(tournament.finishedAt ? 'DOPAMINE WINNER' : 'TOURNAMENT RESULTS', W / 2, y);
  y += 32;

  // Champion
  if (championPair) {
    ctx.fillStyle = '#e8e8f0'; ctx.font = font('700', 20);
    ctx.fillText(championPair.name, W / 2, y);
    y += 16;
  }

  // Divider
  y += 12;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  y += 20;

  // Standings header
  ctx.fillStyle = '#666680'; ctx.font = font('700', 11); ctx.textAlign = 'left';
  ctx.fillText('STANDINGS', pad, y); y += 18;

  // Column positions
  const cols = { rank: pad, name: pad + 30, w: W - 220, l: W - 180, pf: W - 140, pa: W - 100, diff: W - 50 };

  ctx.fillStyle = '#666680'; ctx.font = font('700', 10); ctx.textAlign = 'center';
  ctx.fillText('W', cols.w, y); ctx.fillText('L', cols.l, y); ctx.fillText('PF', cols.pf, y);
  ctx.fillText('PA', cols.pa, y); ctx.fillText('+/-', cols.diff, y); y += rowH - 6;

  standings.forEach((s, i) => {
    const isTop = i === 0 && s.won > 0;
    ctx.textAlign = 'left';
    ctx.fillStyle = isTop ? '#ffd700' : '#666680'; ctx.font = font('800', 13);
    ctx.fillText(`${i + 1}`, cols.rank, y);
    ctx.fillStyle = isTop ? '#ffd700' : '#e8e8f0'; ctx.font = font('600', 13);
    ctx.fillText(truncText(ctx, s.name, 180), cols.name, y);
    ctx.textAlign = 'center'; ctx.font = font('700', 13);
    ctx.fillStyle = '#ff6b35'; ctx.fillText(`${s.won}`, cols.w, y);
    ctx.fillStyle = '#00d4ff'; ctx.fillText(`${s.lost}`, cols.l, y);
    ctx.fillStyle = '#e8e8f0'; ctx.fillText(`${s.pf}`, cols.pf, y);
    ctx.fillStyle = '#e8e8f0'; ctx.fillText(`${s.pa}`, cols.pa, y);
    const d = s.pf - s.pa;
    ctx.fillStyle = d > 0 ? '#50ff50' : d < 0 ? '#ff5050' : '#666680';
    ctx.fillText(`${d > 0 ? '+' : ''}${d}`, cols.diff, y);
    y += rowH;
  });

  // Divider
  y += 8;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  y += 18;

  // Matches
  ctx.fillStyle = '#666680'; ctx.font = font('700', 11); ctx.textAlign = 'left';
  ctx.fillText('MATCHES', pad, y); y += 18;

  const displayMatches = tournament.matches.slice(-matchCount);
  displayMatches.forEach((m, i) => {
    const pA = tournament.pairs.find(p => p.id === m.pairAId);
    const pB = tournament.pairs.find(p => p.id === m.pairBId);
    const aWon = m.winner === m.pairAId;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#666680'; ctx.font = font('700', 11);
    ctx.fillText(`#${tournament.matches.indexOf(m) + 1}`, pad, y);

    ctx.fillStyle = aWon ? '#ffd700' : '#e8e8f0'; ctx.font = font('600', 12);
    ctx.fillText(truncText(ctx, pA?.name || '?', 180), pad + 34, y);

    ctx.textAlign = 'center'; ctx.font = font('800', 13);
    ctx.fillStyle = '#e8e8f0';
    ctx.fillText(`${m.scoreA} - ${m.scoreB}`, W / 2, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = !aWon ? '#ffd700' : '#e8e8f0'; ctx.font = font('600', 12);
    ctx.fillText(truncText(ctx, pB?.name || '?', 180), W - pad, y);
    y += 28;
  });

  // Footer
  y += 16;
  ctx.fillStyle = '#666680'; ctx.font = font('600', 11); ctx.textAlign = 'center';
  ctx.fillText('TT Counter', W / 2, y);

  return c;
}

export async function shareResultsImage(tournament, standings, championPair) {
  const canvas = renderResultsCard(tournament, standings, championPair);
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));

  const champName = championPair?.name || 'Unknown';
  const text = `${champName} is the Dopamine Winner!`;

  if (navigator.share && navigator.canShare) {
    const file = new File([blob], 'tournament-results.png', { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      try { await navigator.share({ title: 'Tournament Results', text, files: [file] }); return true; }
      catch { /* cancelled */ }
    }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'tournament-results.png';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return 'downloaded';
}
