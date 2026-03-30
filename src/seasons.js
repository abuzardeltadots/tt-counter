import { loadSeasons, saveSeasons } from './platform/storage';
import { calcStandings, calcPlayerStats } from './tournament';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function getSeasons() { return loadSeasons(); }

export function createSeason(name) {
  const seasons = loadSeasons();
  const season = { id: genId(), name, tournamentIds: [], createdAt: Date.now(), endedAt: null };
  seasons.unshift(season);
  saveSeasons(seasons);
  return seasons;
}

export function addTournamentToSeason(seasonId, tournamentId) {
  const seasons = loadSeasons();
  const s = seasons.find(x => x.id === seasonId);
  if (s && !s.tournamentIds.includes(tournamentId)) {
    s.tournamentIds.push(tournamentId);
    saveSeasons(seasons);
  }
  return seasons;
}

export function endSeason(seasonId) {
  const seasons = loadSeasons();
  const s = seasons.find(x => x.id === seasonId);
  if (s) { s.endedAt = Date.now(); saveSeasons(seasons); }
  return seasons;
}

export function getSeasonStats(season, allTournaments, members) {
  // Include explicitly added tournaments + any tournament created during the season period
  const tournaments = allTournaments.filter(t => {
    if (season.tournamentIds.includes(t.id)) return true;
    // Auto-include tournaments created after season start (and before season end if ended)
    if (t.createdAt >= season.createdAt && (!season.endedAt || t.createdAt <= season.endedAt)) return true;
    return false;
  });
  const playerStats = calcPlayerStats(members, tournaments);
  const totalMatches = tournaments.reduce((sum, t) => sum + t.matches.filter(m => m.finished).length, 0);
  return { tournaments: tournaments.length, totalMatches, playerStats };
}
