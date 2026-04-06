import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { calcServe, calcServeRemaining, isDeuce, getWinner, getDeuceResetScore, formatDuration } from '../gameLogic'
import { soundScore, soundDeuce, soundWin, soundUndo, ensureAudio } from '../audio'
import { loadHistory, saveHistory, loadSettings, saveSettings, loadMembers, saveMembers, loadActiveTournament, saveActiveTournament, loadTournamentHistory, saveTournamentHistory, updatePlayerRecord, exportAllData, importAllData, validateSyncData } from '../platform/storage'
import { fireConfetti } from '../confetti'
import { createTournament, createRoundRobinTournament, createKnockoutTournament, advanceKnockoutBracket, getNextMatch, processMatchResult, processStandbyPick, calcStandings, calcPlayerStats } from '../tournament'
import { parseSyncHash, clearSyncHash, createSyncUrl, shareSyncUrl, shareResultsImage, createInviteUrl, parseInviteHash, shareDigestImage } from '../share'
import { generateQRDataUrl } from '../qr'
import { getAllElo, getElo, updateElo, balancedPairs, getH2H, getDetailedH2H } from '../elo'
import { getSeasons, createSeason, addTournamentToSeason, endSeason, getSeasonStats } from '../seasons'
import { checkAndUnlock, getPlayerBadges, getAchievementDefs } from '../achievements'
import { vibrateScore, vibrateDeuce, vibrateWin, vibrateUndo, vibrateStreak } from '../platform/haptics'
import useVoice from '../hooks/useVoice'
import useLive from '../hooks/useLive'

const AppContext = createContext(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const PLAYER_COLORS = ['#ff6b35','#00d4ff','#ffd700','#ff5050','#50ff50','#ff50ff','#8b5cf6','#14b8a6','#f97316','#06b6d4','#a855f7','#ec4899'];

export default function AppProvider({ children }) {
  // --- Existing game state ---
  const [settings, setSettings] = useState(() => {
    const s = loadSettings();
    return { targetScore: s.targetScore||21, serveInterval: s.serveInterval||2, teamA: s.teamA||'Team A', teamB: s.teamB||'Team B', vibrate: s.vibrate??true, sound: s.sound??true };
  });
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [serving, setServing] = useState('a');
  const [gameId, setGameId] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [history, setHistory] = useState(() => loadHistory());
  const [screen, setScreen] = useState('setup');
  const [prevScreen, setPrevScreen] = useState('setup');
  const [showSettings, setShowSettings] = useState(false);
  const [bumpTeam, setBumpTeam] = useState(null);
  const [setupTarget, setSetupTarget] = useState(settings.targetScore);
  const [setupServe, setSetupServe] = useState(settings.serveInterval);
  const [setupNameA, setSetupNameA] = useState('Team A');
  const [setupNameB, setSetupNameB] = useState('Team B');
  const [deuceCount, setDeuceCount] = useState(0);
  const [deuceFlash, setDeuceFlash] = useState(false);

  // --- Teams & Tournament state ---
  const [members, setMembers] = useState(() => loadMembers());
  const [memberAvail, setMemberAvail] = useState(() => {
    const m = loadMembers();
    const a = {};
    m.forEach(mb => { a[mb.id] = false; });
    return a;
  });
  const [newMemberName, setNewMemberName] = useState('');
  const [activeTournament, setActiveTournament] = useState(() => loadActiveTournament());
  const [tournamentHistory, setTournamentHistory] = useState(() => loadTournamentHistory());
  const [tournamentMatchId, setTournamentMatchId] = useState(null);
  const [tournamentTab, setTournamentTab] = useState('history');
  const [tSetupTarget, setTSetupTarget] = useState(settings.targetScore);
  const [tSetupServe, setTSetupServe] = useState(settings.serveInterval);
  const [syncData, setSyncData] = useState(null);
  const [shareMsg, setShareMsg] = useState(null);
  const [detailGame, setDetailGame] = useState(null);
  const [showPastTournaments, setShowPastTournaments] = useState(false);

  // --- Enhancement state ---
  const [theme, setTheme] = useState(() => localStorage.getItem('tt_theme') || 'dark');
  const [streak, setStreak] = useState({ team: null, count: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [tFormat, setTFormat] = useState('koth');
  const [balanceElo, setBalanceElo] = useState(false);
  const [newBadges, setNewBadges] = useState([]);
  const [seasons, setSeasons] = useState(() => getSeasons());
  const [showSeasons, setShowSeasons] = useState(false);
  const [h2hPlayers, setH2hPlayers] = useState(null); // { a: playerId, b: playerId }

  const undoStack = useRef([]);
  const confettiRef = useRef(null);
  const timerRef = useRef(null);
  const pointLogRef = useRef([]);
  const importRef = useRef(null);
  const stateRef = useRef();
  stateRef.current = { scoreA, scoreB, serving, screen, settings, gameId, startedAt, deuceCount, tournamentMatchId };

  const winner = getWinner(scoreA, scoreB, settings.targetScore);
  const servesLeft = calcServeRemaining(scoreA, scoreB, settings.targetScore, settings.serveInterval);

  const goTo = useCallback((next) => { setShowSettings(false); setScreen(prev => { setPrevScreen(prev); return next; }); }, []);

  const screenClass = (name) => {
    if (screen === name) return 'screen';
    const order = ['setup','teams','tournament','history','game','win'];
    return order.indexOf(name) < order.indexOf(screen) ? 'screen hidden-left' : 'screen hidden';
  };

  // --- Computed tournament data ---
  const nextMatch = useMemo(() => getNextMatch(activeTournament), [activeTournament]);

  const standings = useMemo(() => {
    if (!activeTournament) return [];
    return calcStandings(activeTournament.pairs, activeTournament.matches);
  }, [activeTournament]);

  const championPair = useMemo(() => {
    if (!activeTournament) return null;
    if (activeTournament.format === 'roundrobin') {
      if (!activeTournament.finishedAt || standings.length === 0) return null;
      return activeTournament.pairs.find(p => p.id === standings[0].pairId) || null;
    }
    if (!activeTournament.currentChampion) return null;
    return activeTournament.pairs.find(p => p.id === activeTournament.currentChampion);
  }, [activeTournament, standings]);

  const allTournaments = useMemo(() => {
    const list = [...tournamentHistory];
    if (activeTournament) list.unshift(activeTournament);
    return list;
  }, [activeTournament, tournamentHistory]);

  const playerStats = useMemo(() => calcPlayerStats(members, allTournaments), [members, allTournaments]);

  const maxWins = standings.length > 0 ? Math.max(...standings.map(s => s.won), 1) : 1;
  const availableMembers = members
    .filter(m => memberAvail[m.id] !== false && memberAvail[m.id] !== undefined)
    .sort((a, b) => {
      const pa = typeof memberAvail[a.id] === 'number' ? memberAvail[a.id] : 9999;
      const pb = typeof memberAvail[b.id] === 'number' ? memberAvail[b.id] : 9999;
      return pa - pb;
    });

  // --- Confetti on dopamine winner ---
  const didCelebrate = useRef(null);
  useEffect(() => {
    if (screen === 'tournament' && activeTournament?.finishedAt && didCelebrate.current !== activeTournament.id) {
      didCelebrate.current = activeTournament.id;
      setTimeout(() => fireConfetti(confettiRef.current), 300);
    }
  }, [screen, activeTournament]);

  // --- Auto-save ---
  const autoSave = useCallback((sA, sB, gId, sAt, w = null, finished = false, dc = null) => {
    if (!gId) return;
    setHistory(prev => {
      const idx = prev.findIndex(h => h.id === gId);
      const s = stateRef.current.settings;
      const entry = { id: gId, teamA: s.teamA, teamB: s.teamB, scoreA: sA, scoreB: sB, targetScore: s.targetScore, serveInterval: s.serveInterval, deuceCount: dc !== null ? dc : stateRef.current.deuceCount, startedAt: sAt, updatedAt: Date.now(), winner: w, finished, ...(finished ? { finishedAt: Date.now() } : {}) };
      let next; if (idx >= 0) { next = [...prev]; next[idx] = { ...prev[idx], ...entry }; } else { next = [entry, ...prev]; }
      saveHistory(next); return next;
    });
  }, []);

  // --- Add point ---
  const addPoint = useCallback((team) => {
    const s = stateRef.current;
    if (s.screen !== 'game' || getWinner(s.scoreA, s.scoreB, s.settings.targetScore)) return;
    undoStack.current.push({ scoreA: s.scoreA, scoreB: s.scoreB, serving: s.serving, deuceCount: s.deuceCount });
    if (undoStack.current.length > 100) undoStack.current.shift();
    let nA = team === 'a' ? s.scoreA+1 : s.scoreA;
    let nB = team === 'b' ? s.scoreB+1 : s.scoreB;
    let newDc = s.deuceCount;
    if (s.settings.vibrate) vibrateScore();
    if (s.settings.sound) soundScore();
    setBumpTeam(team); setTimeout(() => setBumpTeam(null), 300);
    // Streak tracking
    setStreak(prev => {
      const next = prev.team === team ? { team, count: prev.count + 1 } : { team, count: 1 };
      // Streak milestone haptics
      if (s.settings.vibrate && (next.count === 3 || next.count === 5 || next.count === 10)) {
        vibrateStreak(next.count);
      }
      return next;
    });
    pointLogRef.current.push({ team, scoreA: nA, scoreB: nB, t: Date.now() });
    const w = getWinner(nA, nB, s.settings.targetScore);
    if (isDeuce(nA, nB, s.settings.targetScore)) {
      const resetScore = getDeuceResetScore(s.settings.targetScore);
      newDc = s.deuceCount + 1;
      setDeuceCount(newDc);
      setDeuceFlash(true); setTimeout(() => setDeuceFlash(false), 1500);
      nA = resetScore; nB = resetScore;
      setTimeout(() => { if (s.settings.sound) soundDeuce(); if (s.settings.vibrate) vibrateDeuce(); }, 200);
    }
    const nServe = calcServe(nA, nB, s.settings.targetScore, s.settings.serveInterval);
    setScoreA(nA); setScoreB(nB); setServing(nServe);
    // Eagerly update stateRef so rapid taps see new state
    stateRef.current = { ...s, scoreA: nA, scoreB: nB, serving: nServe, deuceCount: newDc };
    autoSave(nA, nB, s.gameId, s.startedAt, w, !!w, newDc);
    if (w && s.tournamentMatchId) {
      setActiveTournament(prev => {
        if (!prev) return prev;
        // Find the match pair info BEFORE updating (for ELO)
        let winPair = null, losePair = null;
        if (prev.format === 'roundrobin' || prev.format === 'knockout') {
          const m = prev.matches.find(x => x.id === s.tournamentMatchId);
          if (m) {
            const pA = prev.pairs.find(p => p.id === m.pairAId);
            const pB = prev.pairs.find(p => p.id === m.pairBId);
            winPair = w === 'a' ? pA : pB;
            losePair = w === 'a' ? pB : pA;
          }
        } else {
          const nm = getNextMatch(prev);
          if (nm) { winPair = w === 'a' ? nm.pairA : nm.pairB; losePair = w === 'a' ? nm.pairB : nm.pairA; }
        }
        // Update ELO + player records with fresh data
        if (winPair && losePair) {
          updateElo(winPair.players.map(p => p.id), losePair.players.map(p => p.id));
          winPair.players.forEach(p => updatePlayerRecord(p.id, true, nA, nB));
          losePair.players.forEach(p => updatePlayerRecord(p.id, false, nB, nA));
        }
        // Now update tournament state
        if (prev.format === 'roundrobin' || prev.format === 'knockout') {
          const matches = prev.matches.map(m => {
            if (m.id !== s.tournamentMatchId) return m;
            return { ...m, scoreA: nA, scoreB: nB, finished: true, winner: w === 'a' ? m.pairAId : m.pairBId, deuceCount: newDc };
          });
          let updated = { ...prev, matches };
          if (prev.format === 'roundrobin') {
            if (matches.every(m => m.finished)) updated.finishedAt = Date.now();
          } else {
            updated = advanceKnockoutBracket(updated);
          }
          saveActiveTournament(updated);
          return updated;
        }
        const updated = processMatchResult(prev, s.gameId, nA, nB, w, newDc);
        saveActiveTournament(updated);
        return updated;
      });
    }
    if (w) setTimeout(() => { if (s.settings.sound) soundWin(); if (s.settings.vibrate) vibrateWin(); goTo('win'); fireConfetti(confettiRef.current); }, 500);
  }, [autoSave, goTo]);

  // --- Undo ---
  const undo = useCallback(() => {
    if (!undoStack.current.length) return;
    const s = stateRef.current;
    if (getWinner(s.scoreA, s.scoreB, s.settings.targetScore)) return;
    const prev = undoStack.current.pop();
    setScoreA(prev.scoreA); setScoreB(prev.scoreB); setServing(prev.serving);
    if (prev.deuceCount !== undefined) setDeuceCount(prev.deuceCount);
    if (s.settings.vibrate) vibrateUndo();
    if (s.settings.sound) soundUndo();
    autoSave(prev.scoreA, prev.scoreB, s.gameId, s.startedAt);
  }, [autoSave]);

  // --- Voice hook ---
  const { voiceOn, toggleVoice, stopVoice } = useVoice(addPoint, undo);

  // --- Live hook ---
  const live = useLive();

  // --- PeerJS Live Spectator: host broadcast ---
  useEffect(() => {
    if (live.liveCode && screen === 'game') {
      live.broadcast({ scoreA, scoreB, serving, teamA: settings.teamA, teamB: settings.teamB, target: settings.targetScore, deuceCount, elapsed, streak, winner: getWinner(scoreA, scoreB, settings.targetScore) });
    }
  }, [live.liveCode, screen, scoreA, scoreB, serving, settings, deuceCount, elapsed, streak]);

  // --- Start a regular game ---
  const startGame = useCallback((target, serve, nameA, nameB) => {
    const ns = { ...stateRef.current.settings, targetScore: target, serveInterval: serve, teamA: nameA, teamB: nameB };
    setSettings(ns); saveSettings(ns);
    setScoreA(0); setScoreB(0); setServing('a'); setGameId(genId()); setStartedAt(Date.now()); setDeuceCount(0);
    setTournamentMatchId(null); setStreak({ team: null, count: 0 }); setElapsed(0); pointLogRef.current = [];
    undoStack.current = []; goTo('game');
  }, [goTo]);

  // --- Continue a game from history ---
  const continueGame = useCallback((g) => {
    const ns = { ...stateRef.current.settings, targetScore: g.targetScore, serveInterval: g.serveInterval||2, teamA: g.teamA, teamB: g.teamB };
    setSettings(ns); saveSettings(ns);
    setScoreA(g.scoreA); setScoreB(g.scoreB); setServing(calcServe(g.scoreA, g.scoreB, g.targetScore, g.serveInterval||2));
    setGameId(g.id); setStartedAt(g.startedAt); setDeuceCount(g.deuceCount||0);
    setTournamentMatchId(null);
    undoStack.current = []; goTo('game');
  }, [goTo]);

  const deleteGame = useCallback((id) => { setHistory(prev => { const n = prev.filter(h => h.id !== id); saveHistory(n); return n; }); }, []);

  const goSetup = useCallback(() => {
    const s = stateRef.current.settings;
    setSetupTarget(s.targetScore); setSetupServe(s.serveInterval); setSetupNameA('Team A'); setSetupNameB('Team B'); goTo('setup');
  }, [goTo]);

  // --- Quick rematch ---
  const quickRematch = useCallback(() => {
    const s = stateRef.current.settings;
    setScoreA(0); setScoreB(0); setServing('a'); setGameId(genId()); setStartedAt(Date.now()); setDeuceCount(0);
    setTournamentMatchId(null); setStreak({ team: null, count: 0 }); setElapsed(0); pointLogRef.current = [];
    undoStack.current = []; goTo('game');
  }, [goTo]);

  // --- Member management ---
  const addMember = useCallback(() => {
    const name = newMemberName.trim();
    if (!name) return;
    const id = genId();
    setMembers(prev => { const n = [...prev, { id, name }]; saveMembers(n); return n; });
    setMemberAvail(prev => ({ ...prev, [id]: false }));
    setNewMemberName('');
  }, [newMemberName]);

  const deleteMember = useCallback((id) => {
    if (activeTournament && !activeTournament.finishedAt && activeTournament.matches?.length > 0) return;
    setMembers(prev => { const n = prev.filter(m => m.id !== id); saveMembers(n); return n; });
    setMemberAvail(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, [activeTournament]);

  const toggleAvail = useCallback((id) => {
    // Only block during tournament with active matches (not just created/finished)
    if (activeTournament && !activeTournament.finishedAt && activeTournament.matches?.length > 0) return;
    setMemberAvail(prev => {
      if (prev[id] !== false && prev[id] !== undefined && prev[id] !== true) {
        // Already has a priority number — uncheck it, shift others down
        const removedPriority = prev[id];
        const next = { ...prev, [id]: false };
        Object.keys(next).forEach(k => { if (typeof next[k] === 'number' && next[k] > removedPriority) next[k]--; });
        return next;
      }
      if (prev[id] === false) {
        // Unchecked → assign next priority number
        const maxPriority = Math.max(0, ...Object.values(prev).filter(v => typeof v === 'number'));
        return { ...prev, [id]: maxPriority + 1 };
      }
      // true or undefined → uncheck
      return { ...prev, [id]: false };
    });
  }, [activeTournament]);

  const uncheckAll = useCallback(() => {
    if (activeTournament && !activeTournament.finishedAt && activeTournament.matches?.length > 0) return;
    setMemberAvail(prev => {
      const next = {};
      Object.keys(prev).forEach(k => { next[k] = false; });
      return next;
    });
  }, [activeTournament]);

  // --- Generate pairs & start tournament ---
  const generateAndStart = useCallback(() => {
    const minPlayers = tFormat === 'roundrobin' ? 6 : 4;
    if (availableMembers.length < minPlayers) return;
    const bFn = balanceElo ? balancedPairs : null;
    const t = tFormat === 'roundrobin'
      ? createRoundRobinTournament(availableMembers, tSetupTarget, tSetupServe, bFn)
      : tFormat === 'knockout'
      ? createKnockoutTournament(availableMembers, tSetupTarget, tSetupServe, bFn)
      : createTournament(availableMembers, tSetupTarget, tSetupServe, bFn);
    setActiveTournament(t);
    saveActiveTournament(t);
    setTournamentTab('history');
    didCelebrate.current = null;
    goTo('tournament');
  }, [availableMembers, tSetupTarget, tSetupServe, tFormat, balanceElo, goTo]);

  // --- Play the next tournament match ---
  const playNextMatch = useCallback(() => {
    if (!activeTournament || activeTournament.pendingPick || activeTournament.finishedAt) return;
    const nm = getNextMatch(activeTournament);
    if (!nm) return;
    const ns = { ...stateRef.current.settings, targetScore: activeTournament.targetScore, serveInterval: activeTournament.serveInterval, teamA: nm.pairA.name, teamB: nm.pairB.name };
    setSettings(ns); saveSettings(ns);
    setScoreA(0); setScoreB(0); setServing('a'); setGameId(genId()); setStartedAt(Date.now()); setDeuceCount(0);
    setTournamentMatchId(genId());
    setStreak({ team: null, count: 0 }); setElapsed(0); pointLogRef.current = [];
    undoStack.current = []; goTo('game');
  }, [activeTournament, goTo]);

  // --- Standby player picks from loser ---
  const handleStandbyPick = useCallback((pickedPlayerId) => {
    setActiveTournament(prev => {
      const updated = processStandbyPick(prev, pickedPlayerId);
      saveActiveTournament(updated);
      return updated;
    });
  }, []);

  // --- Back to tournament from win screen ---
  const backToTournament = useCallback(() => {
    setTournamentMatchId(null);
    goTo('tournament');
  }, [goTo]);

  // --- End tournament (crown dopamine winner) ---
  const endTournament = useCallback(() => {
    setActiveTournament(prev => {
      if (!prev || !prev.currentChampion) return prev;
      const finished = { ...prev, finishedAt: Date.now(), pendingPick: null };
      saveActiveTournament(finished);
      return finished;
    });
  }, []);

  // --- Archive finished tournament & start fresh ---
  const finishAndArchive = useCallback(() => {
    setActiveTournament(prev => {
      if (!prev) return null;
      const finished = { ...prev, finishedAt: prev.finishedAt || Date.now() };
      setTournamentHistory(h => { const n = [finished, ...h]; saveTournamentHistory(n); return n; });
      // Auto-add to active season (if one exists)
      const currentSeasons = getSeasons();
      const activeSeason = currentSeasons.find(s => !s.endedAt);
      if (activeSeason) { setSeasons(addTournamentToSeason(activeSeason.id, finished.id)); }
      saveActiveTournament(null);
      return null;
    });
    didCelebrate.current = null;
    goTo('teams');
  }, [goTo]);

  // --- Discard active tournament ---
  const discardTournament = useCallback(() => {
    setActiveTournament(null);
    saveActiveTournament(null);
    didCelebrate.current = null;
    goTo('teams');
  }, [goTo]);

  // --- Start a round-robin match ---
  const startRRMatch = useCallback((match) => {
    if (!activeTournament || match.finished) return;
    const pA = activeTournament.pairs.find(p => p.id === match.pairAId);
    const pB = activeTournament.pairs.find(p => p.id === match.pairBId);
    if (!pA || !pB) return;
    const ns = { ...stateRef.current.settings, targetScore: activeTournament.targetScore, serveInterval: activeTournament.serveInterval, teamA: pA.name, teamB: pB.name };
    setSettings(ns); saveSettings(ns);
    setScoreA(0); setScoreB(0); setServing('a'); setGameId(genId()); setStartedAt(Date.now()); setDeuceCount(0);
    setTournamentMatchId(match.id); setStreak({ team: null, count: 0 }); setElapsed(0); pointLogRef.current = [];
    undoStack.current = []; goTo('game');
  }, [activeTournament, goTo]);

  // --- End round-robin tournament ---
  const endRRTournament = useCallback(() => {
    setActiveTournament(prev => {
      if (!prev) return prev;
      const finished = { ...prev, finishedAt: Date.now() };
      saveActiveTournament(finished);
      return finished;
    });
  }, []);

  // --- Voice cleanup when leaving game ---
  useEffect(() => {
    if (screen !== 'game' && voiceOn) stopVoice();
  }, [screen]);

  // --- Timer effect ---
  useEffect(() => {
    if (screen === 'game' && startedAt && !winner) {
      timerRef.current = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    } else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [screen, startedAt, winner]);

  // --- Theme effect ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tt_theme', theme);
  }, [theme]);

  // --- Export / Import ---
  const handleExport = useCallback(() => {
    const data = exportAllData(theme);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'tt-counter-backup.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, [theme]);

  const handleImport = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        importAllData(d);
        // Update React state from imported data
        if (d.history) setHistory(d.history);
        if (d.settings) setSettings(prev => ({ ...prev, ...d.settings }));
        if (d.members) { setMembers(d.members); const a = {}; d.members.forEach(m => { a[m.id] = false; }); setMemberAvail(a); }
        if (d.activeTournament) setActiveTournament(d.activeTournament);
        if (d.tournamentHistory) setTournamentHistory(d.tournamentHistory);
        if (d.seasons) setSeasons(d.seasons);
        if (d.theme) setTheme(d.theme);
        setShowSettings(false);
      } catch { /* invalid file */ }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // --- Sync: detect URL hash on mount ---
  useEffect(() => {
    const data = parseSyncHash();
    if (data && data.t) { setSyncData(data); clearSyncHash(); }
    const invite = parseInviteHash();
    if (invite && invite.type === 'invite') {
      if (invite.m) { setMembers(invite.m); saveMembers(invite.m); const a = {}; invite.m.forEach(mb => { a[mb.id] = false; }); setMemberAvail(a); }
      if (invite.ts) setTSetupTarget(invite.ts);
      if (invite.si) setTSetupServe(invite.si);
      if (invite.f) setTFormat(invite.f);
      clearSyncHash();
      goTo('teams');
    }
  }, []);

  const handleSyncImport = useCallback(() => {
    if (!syncData) return;
    if (!validateSyncData(syncData)) { setSyncData(null); return; }
    if (syncData.m) { setMembers(syncData.m); saveMembers(syncData.m); const a = {}; syncData.m.forEach(mb => { a[mb.id] = false; }); setMemberAvail(a); }
    if (syncData.t) { setActiveTournament(syncData.t); saveActiveTournament(syncData.t); }
    setSyncData(null);
    goTo('tournament');
  }, [syncData, goTo]);

  // --- Share handlers ---
  const handleShareSync = useCallback(async () => {
    if (!activeTournament) return;
    const url = createSyncUrl(activeTournament, members);
    const result = await shareSyncUrl(url);
    if (result === 'copied') { setShareMsg('Link copied!'); setTimeout(() => setShareMsg(null), 2000); }
  }, [activeTournament, members]);

  const handleShareResults = useCallback(async () => {
    if (!activeTournament) return;
    const result = await shareResultsImage(activeTournament, standings, championPair);
    if (result === 'downloaded') { setShareMsg('Image saved!'); setTimeout(() => setShareMsg(null), 2000); }
  }, [activeTournament, standings, championPair]);

  const shareGameResult = useCallback(async (g) => {
    const text = `${g.teamA} ${g.scoreA} - ${g.scoreB} ${g.teamB}${g.winner ? ` | ${g.winner === 'a' ? g.teamA : g.teamB} wins!` : ''}${g.deuceCount ? ` | ${g.deuceCount} deuces` : ''} | TT Counter`;
    if (navigator.share) { try { await navigator.share({ title: 'Match Result', text }); } catch {} }
    else if (navigator.clipboard) { await navigator.clipboard.writeText(text); }
  }, []);

  const shareInviteLink = useCallback(async () => {
    const url = createInviteUrl(members, tSetupTarget, tSetupServe, tFormat);
    if (navigator.share) { try { await navigator.share({ title: 'TT Counter - Join Tournament', url }); } catch {} }
    else if (navigator.clipboard) { await navigator.clipboard.writeText(url); setShareMsg('Invite copied!'); setTimeout(() => setShareMsg(null), 2000); }
  }, [members, tSetupTarget, tSetupServe, tFormat]);

  const getQRCode = useCallback((text) => generateQRDataUrl(text), []);

  const shareWeeklyDigest = useCallback(async () => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentGames = history.filter(g => g.finished && g.startedAt > oneWeekAgo);
    await shareDigestImage(playerStats, recentGames);
  }, [history, playerStats]);

  // --- Key handlers & wake lock ---
  useEffect(() => {
    const handler = (e) => {
      if (stateRef.current.screen !== 'game') return;
      if (e.key==='AudioVolumeUp'||e.key==='VolumeUp'||e.key==='ArrowUp') { e.preventDefault(); addPoint('a'); }
      else if (e.key==='AudioVolumeDown'||e.key==='VolumeDown'||e.key==='ArrowDown') { e.preventDefault(); addPoint('b'); }
      else if ((e.key==='z'||e.key==='Z')&&(e.ctrlKey||e.metaKey)) { e.preventDefault(); undo(); }
    };
    const noCtx = e => e.preventDefault();
    document.addEventListener('keydown', handler);
    document.addEventListener('contextmenu', noCtx);
    document.addEventListener('touchstart', ensureAudio, { once: true });
    document.addEventListener('click', ensureAudio, { once: true });
    return () => { document.removeEventListener('keydown', handler); document.removeEventListener('contextmenu', noCtx); };
  }, [addPoint, undo]);

  useEffect(() => {
    const lock = async () => { try { if ('wakeLock' in navigator) await navigator.wakeLock.request('screen'); } catch {} };
    lock();
    const h = () => { if (document.visibilityState === 'visible') lock(); };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, []);

  const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

  const value = {
    // State
    settings, setSettings, scoreA, scoreB, serving, gameId, startedAt,
    history, setHistory, screen, prevScreen, showSettings, setShowSettings,
    bumpTeam, setupTarget, setSetupTarget, setupServe, setSetupServe,
    setupNameA, setSetupNameA, setupNameB, setSetupNameB,
    deuceCount, deuceFlash, members, setMembers, memberAvail, setMemberAvail,
    newMemberName, setNewMemberName, activeTournament, setActiveTournament,
    tournamentHistory, setTournamentHistory, tournamentMatchId, setTournamentMatchId,
    tournamentTab, setTournamentTab, tSetupTarget, setTSetupTarget,
    tSetupServe, setTSetupServe, syncData, setSyncData, shareMsg, setShareMsg,
    detailGame, setDetailGame, showPastTournaments, setShowPastTournaments,
    theme, setTheme, streak, elapsed, tFormat, setTFormat,
    balanceElo, setBalanceElo, newBadges, setNewBadges,

    // Refs
    confettiRef, pointLogRef, importRef,

    // Computed
    winner, servesLeft, nextMatch, standings, championPair, allTournaments,
    playerStats, maxWins, availableMembers,

    // Callbacks
    goTo, screenClass, autoSave, addPoint, undo, startGame, continueGame,
    deleteGame, goSetup, quickRematch, addMember, deleteMember, toggleAvail, uncheckAll,
    generateAndStart, playNextMatch, handleStandbyPick, backToTournament,
    endTournament, finishAndArchive, discardTournament, startRRMatch,
    endRRTournament, handleExport, handleImport, handleSyncImport,
    handleShareSync, handleShareResults, shareGameResult, shareInviteLink,
    getQRCode, shareWeeklyDigest, fmtDate,

    // Voice
    voiceOn, toggleVoice, stopVoice,

    // Live
    liveCode: live.liveCode, liveViewers: live.liveViewers,
    spectating: live.spectating,
    showJoinModal: live.showJoinModal, setShowJoinModal: live.setShowJoinModal,
    joinCode: live.joinCode, setJoinCode: live.setJoinCode,
    startHosting: live.startHosting, stopHosting: live.stopHosting,
    joinAsSpectator: live.joinAsSpectator, leaveSpectator: live.leaveSpectator,

    // Seasons
    seasons, setSeasons, showSeasons, setShowSeasons,
    createSeasonAction: (name) => { setSeasons(createSeason(name)); },
    addToSeason: (seasonId, tournamentId) => { setSeasons(addTournamentToSeason(seasonId, tournamentId)); },
    endSeasonAction: (seasonId) => { setSeasons(endSeason(seasonId)); },
    getSeasonStats: (season) => getSeasonStats(season, allTournaments, members),

    // H2H
    h2hPlayers, setH2hPlayers,
    getDetailedH2H: (pA, pB) => getDetailedH2H(pA, pB, allTournaments),

    // Utilities
    getElo, getPlayerBadges, calcStandings, formatDuration,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
