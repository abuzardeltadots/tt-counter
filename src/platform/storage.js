// Platform: Web (swap for AsyncStorage in React Native)

function safeSave(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') return false;
    return false;
  }
}

function safeLoad(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}

// --- Game History ---
export function loadHistory() { return safeLoad('tt_history', []); }
export function saveHistory(h) {
  if (!safeSave('tt_history', h)) {
    // Quota exceeded — trim oldest 50 and retry
    const trimmed = h.slice(0, Math.max(h.length - 50, 10));
    safeSave('tt_history', trimmed);
    return 'trimmed';
  }
  return 'ok';
}

// --- Settings ---
export function loadSettings() { return safeLoad('tt_settings', {}); }
export function saveSettings(s) { safeSave('tt_settings', s); }

// --- Members ---
export function loadMembers() { return safeLoad('tt_members', []); }
export function saveMembers(m) { safeSave('tt_members', m); }

// --- Active Tournament ---
export function loadActiveTournament() { return safeLoad('tt_active_tournament', null); }
export function saveActiveTournament(t) { safeSave('tt_active_tournament', t); }

// --- Tournament History ---
export function loadTournamentHistory() { return safeLoad('tt_tournament_history', []); }
export function saveTournamentHistory(h) {
  if (!safeSave('tt_tournament_history', h)) {
    const trimmed = h.slice(0, Math.max(h.length - 10, 5));
    safeSave('tt_tournament_history', trimmed);
    return 'trimmed';
  }
  return 'ok';
}

// --- Player Lifetime Records (survives history deletion) ---
export function loadPlayerRecords() { return safeLoad('tt_player_records', {}); }
export function savePlayerRecords(r) { safeSave('tt_player_records', r); }
export function updatePlayerRecord(playerId, won, pf, pa) {
  const records = loadPlayerRecords();
  const r = records[playerId] || { w: 0, l: 0, pf: 0, pa: 0, gp: 0 };
  r.gp++;
  if (won) r.w++; else r.l++;
  r.pf += pf; r.pa += pa;
  records[playerId] = r;
  savePlayerRecords(records);
}

// --- Seasons ---
export function loadSeasons() { return safeLoad('tt_seasons', []); }
export function saveSeasons(s) { safeSave('tt_seasons', s); }

// --- Storage Quota Check ---
export function getStorageUsage() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('tt_')) total += (localStorage.getItem(key) || '').length;
  }
  return { usedKB: Math.round(total / 1024), limitKB: 5120 };
}

// --- Validate imported data shape ---
export function validateSyncData(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.t) {
    if (!data.t.id || !Array.isArray(data.t.pairs) || !Array.isArray(data.t.matches)) return false;
    if (!data.t.targetScore || !data.t.serveInterval) return false;
  }
  if (data.m && !Array.isArray(data.m)) return false;
  return true;
}

// --- Export all data ---
export function exportAllData(theme) {
  return {
    history: loadHistory(),
    settings: loadSettings(),
    members: loadMembers(),
    activeTournament: loadActiveTournament(),
    tournamentHistory: loadTournamentHistory(),
    elo: safeLoad('tt_elo', {}),
    badges: safeLoad('tt_badges', {}),
    playerRecords: loadPlayerRecords(),
    seasons: loadSeasons(),
    theme,
    v: 2
  };
}

// --- Import all data ---
export function importAllData(d) {
  if (d.history && Array.isArray(d.history)) safeSave('tt_history', d.history);
  if (d.settings && typeof d.settings === 'object') safeSave('tt_settings', d.settings);
  if (d.members && Array.isArray(d.members)) safeSave('tt_members', d.members);
  if (d.activeTournament) safeSave('tt_active_tournament', d.activeTournament);
  if (d.tournamentHistory && Array.isArray(d.tournamentHistory)) safeSave('tt_tournament_history', d.tournamentHistory);
  if (d.elo) safeSave('tt_elo', d.elo);
  if (d.badges) safeSave('tt_badges', d.badges);
  if (d.playerRecords) safeSave('tt_player_records', d.playerRecords);
  if (d.seasons) safeSave('tt_seasons', d.seasons);
  return d;
}
