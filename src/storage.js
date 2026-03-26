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
