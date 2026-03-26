export function loadHistory() {
  try { return JSON.parse(localStorage.getItem('tt_history') || '[]'); }
  catch { return []; }
}
export function saveHistory(h) { localStorage.setItem('tt_history', JSON.stringify(h)); }
export function loadSettings() {
  try { return JSON.parse(localStorage.getItem('tt_settings') || '{}'); }
  catch { return {}; }
}
export function saveSettings(s) { localStorage.setItem('tt_settings', JSON.stringify(s)); }

export function loadMembers() {
  try { return JSON.parse(localStorage.getItem('tt_members') || '[]'); }
  catch { return []; }
}
export function saveMembers(m) { localStorage.setItem('tt_members', JSON.stringify(m)); }

export function loadActiveTournament() {
  try { return JSON.parse(localStorage.getItem('tt_active_tournament') || 'null'); }
  catch { return null; }
}
export function saveActiveTournament(t) { localStorage.setItem('tt_active_tournament', JSON.stringify(t)); }

export function loadTournamentHistory() {
  try { return JSON.parse(localStorage.getItem('tt_tournament_history') || '[]'); }
  catch { return []; }
}
export function saveTournamentHistory(h) { localStorage.setItem('tt_tournament_history', JSON.stringify(h)); }
