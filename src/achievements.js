const DEFS = [
  { id: 'first_blood', name: 'First Blood', desc: 'Win your first match', icon: '\u2694\uFE0F' },
  { id: 'dopamine', name: 'Dopamine Rush', desc: 'Win a tournament', icon: '\uD83C\uDFC6' },
  { id: 'deuce5', name: 'Deuce Master', desc: '5+ deuces in one match', icon: '\uD83C\uDFAF' },
  { id: 'streak5', name: 'On Fire', desc: '5-point scoring streak', icon: '\uD83D\uDD25' },
  { id: 'comeback', name: 'Comeback King', desc: 'Win after trailing by 10+', icon: '\uD83D\uDC51' },
  { id: 'clean', name: 'Clean Sweep', desc: 'Win a shutout', icon: '\uD83E\uDDF9' },
  { id: 'veteran', name: 'Veteran', desc: 'Play 50 matches', icon: '\u2B50' },
  { id: 'undefeated', name: 'Undefeated', desc: '5 tournament wins in a row', icon: '\uD83D\uDC8E' },
];

export function getAchievementDefs() { return DEFS; }

export function loadUnlocked() {
  try { return JSON.parse(localStorage.getItem('tt_badges') || '{}'); }
  catch { return {}; }
}
function saveUnlocked(d) { localStorage.setItem('tt_badges', JSON.stringify(d)); }

// gameData: { deuceCount, maxStreak, maxDeficit, won, loserScore }
// stats: from calcPlayerStats for this player
export function checkAndUnlock(playerId, gameData, stats) {
  const all = loadUnlocked();
  const has = all[playerId] || [];
  const fresh = [];

  const tryUnlock = (id) => { if (!has.includes(id)) { has.push(id); fresh.push(DEFS.find(d => d.id === id)); } };

  if (stats?.won >= 1) tryUnlock('first_blood');
  if (stats?.tournamentWins >= 1) tryUnlock('dopamine');
  if (gameData?.deuceCount >= 5) tryUnlock('deuce5');
  if (gameData?.maxStreak >= 5) tryUnlock('streak5');
  if (gameData?.maxDeficit >= 10 && gameData?.won) tryUnlock('comeback');
  if (gameData?.won && gameData?.loserScore === 0) tryUnlock('clean');
  if (stats?.played >= 50) tryUnlock('veteran');
  if (stats?.tournamentWins >= 5) tryUnlock('undefeated');

  all[playerId] = has;
  saveUnlocked(all);
  return fresh; // newly unlocked
}

export function getPlayerBadges(playerId) {
  const all = loadUnlocked();
  const ids = all[playerId] || [];
  return DEFS.filter(d => ids.includes(d.id));
}
