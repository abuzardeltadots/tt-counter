import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { calcServe, calcServeRemaining, isDeuce, getWinner, getDeuceResetScore, formatDuration } from './gameLogic'
import { soundScore, soundDeuce, soundWin, soundUndo, vib, ensureAudio } from './audio'
import { loadHistory, saveHistory, loadSettings, saveSettings, loadMembers, saveMembers, loadActiveTournament, saveActiveTournament, loadTournamentHistory, saveTournamentHistory } from './storage'
import { fireConfetti } from './confetti'
import { createTournament, createRoundRobinTournament, getNextMatch, processMatchResult, processStandbyPick, calcStandings, calcPlayerStats } from './tournament'
import { parseSyncHash, clearSyncHash, createSyncUrl, shareSyncUrl, shareResultsImage } from './share'
import { getAllElo, getElo, updateElo, balancedPairs, getH2H } from './elo'
import { checkAndUnlock, getPlayerBadges, getAchievementDefs } from './achievements'

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const IconPlay = () => <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const IconUndo = () => <svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>;
const IconHistory = () => <svg viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>;
const IconBack = () => <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;
const IconNew = () => <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>;
const IconPlus = () => <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const IconDelete = () => <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const IconSettings = () => <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/></svg>;
const IconUsers = () => <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;
const IconShuffle = () => <svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>;
const IconTrophy = () => <svg viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>;
const IconStop = () => <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>;
const IconShare = () => <svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>;
const IconMic = () => <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>;
const IconLive = () => <svg viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>;
const IconDownload = () => <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>;
const IconUpload = () => <svg viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>;

export default function App() {
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
  const [setupNameA, setSetupNameA] = useState(settings.teamA);
  const [setupNameB, setSetupNameB] = useState(settings.teamB);
  const [deuceCount, setDeuceCount] = useState(0);
  const [deuceFlash, setDeuceFlash] = useState(false);

  // --- Teams & Tournament state ---
  const [members, setMembers] = useState(() => loadMembers());
  const [memberAvail, setMemberAvail] = useState(() => {
    const m = loadMembers();
    const a = {};
    m.forEach(mb => { a[mb.id] = true; });
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

  // --- Enhancement state ---
  const [theme, setTheme] = useState(() => localStorage.getItem('tt_theme') || 'dark');
  const [voiceOn, setVoiceOn] = useState(false);
  const [liveOn, setLiveOn] = useState(false);
  const [streak, setStreak] = useState({ team: null, count: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [tFormat, setTFormat] = useState('koth');
  const [balanceElo, setBalanceElo] = useState(false);
  const [newBadges, setNewBadges] = useState([]);

  const undoStack = useRef([]);
  const confettiRef = useRef(null);
  const timerRef = useRef(null);
  const pointLogRef = useRef([]);
  const channelRef = useRef(null);
  const recognitionRef = useRef(null);
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
  const availableMembers = members.filter(m => memberAvail[m.id] !== false);

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
    if (s.settings.vibrate) vib();
    if (s.settings.sound) soundScore();
    setBumpTeam(team); setTimeout(() => setBumpTeam(null), 300);
    // Streak tracking
    setStreak(prev => prev.team === team ? { team, count: prev.count + 1 } : { team, count: 1 });
    pointLogRef.current.push({ team, scoreA: nA, scoreB: nB, t: Date.now() });
    const w = getWinner(nA, nB, s.settings.targetScore);
    if (isDeuce(nA, nB, s.settings.targetScore)) {
      const resetScore = getDeuceResetScore(s.settings.targetScore);
      newDc = s.deuceCount + 1;
      setDeuceCount(newDc);
      setDeuceFlash(true); setTimeout(() => setDeuceFlash(false), 1500);
      nA = resetScore; nB = resetScore;
      setTimeout(() => { if (s.settings.sound) soundDeuce(); if (s.settings.vibrate) vib(30); }, 200);
    }
    const nServe = calcServe(nA, nB, s.settings.targetScore, s.settings.serveInterval);
    setScoreA(nA); setScoreB(nB); setServing(nServe);
    // Eagerly update stateRef so rapid taps see new state
    stateRef.current = { ...s, scoreA: nA, scoreB: nB, serving: nServe, deuceCount: newDc };
    autoSave(nA, nB, s.gameId, s.startedAt, w, !!w, newDc);
    if (w && s.tournamentMatchId) {
      setActiveTournament(prev => {
        if (!prev) return prev;
        if (prev.format === 'roundrobin') {
          const matches = prev.matches.map(m => {
            if (m.id !== s.tournamentMatchId) return m;
            return { ...m, scoreA: nA, scoreB: nB, finished: true, winner: w === 'a' ? m.pairAId : m.pairBId, deuceCount: newDc };
          });
          const allDone = matches.every(m => m.finished);
          const updated = { ...prev, matches, ...(allDone ? { finishedAt: Date.now() } : {}) };
          saveActiveTournament(updated);
          return updated;
        }
        const updated = processMatchResult(prev, s.gameId, nA, nB, w, newDc);
        saveActiveTournament(updated);
        return updated;
      });
    }
    // ELO update on win (for tournament matches)
    if (w && s.tournamentMatchId && activeTournament) {
      const nm = activeTournament.format === 'roundrobin'
        ? (() => { const m = activeTournament.matches.find(x => x.id === s.tournamentMatchId); if (!m) return null; return { pairA: activeTournament.pairs.find(p => p.id === m.pairAId), pairB: activeTournament.pairs.find(p => p.id === m.pairBId) }; })()
        : getNextMatch(activeTournament);
      if (nm) {
        const winPair = w === 'a' ? nm.pairA : nm.pairB;
        const losePair = w === 'a' ? nm.pairB : nm.pairA;
        if (winPair && losePair) updateElo(winPair.players.map(p => p.id), losePair.players.map(p => p.id));
      }
    }
    if (w) setTimeout(() => { if (s.settings.sound) soundWin(); if (s.settings.vibrate) vib([50,50,50,50,100]); goTo('win'); fireConfetti(confettiRef.current); }, 500);
  }, [autoSave, goTo, activeTournament]);

  // --- Undo ---
  const undo = useCallback(() => {
    if (!undoStack.current.length) return;
    const s = stateRef.current;
    if (getWinner(s.scoreA, s.scoreB, s.settings.targetScore)) return;
    const prev = undoStack.current.pop();
    setScoreA(prev.scoreA); setScoreB(prev.scoreB); setServing(prev.serving);
    if (prev.deuceCount !== undefined) setDeuceCount(prev.deuceCount);
    if (s.settings.vibrate) vib(8);
    if (s.settings.sound) soundUndo();
    autoSave(prev.scoreA, prev.scoreB, s.gameId, s.startedAt);
  }, [autoSave]);

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

  // --- Member management ---
  const addMember = useCallback(() => {
    const name = newMemberName.trim();
    if (!name) return;
    const id = genId();
    setMembers(prev => { const n = [...prev, { id, name }]; saveMembers(n); return n; });
    setMemberAvail(prev => ({ ...prev, [id]: true }));
    setNewMemberName('');
  }, [newMemberName]);

  const deleteMember = useCallback((id) => {
    if (activeTournament && !activeTournament.finishedAt) return;
    setMembers(prev => { const n = prev.filter(m => m.id !== id); saveMembers(n); return n; });
    setMemberAvail(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, [activeTournament]);

  const toggleAvail = useCallback((id) => {
    if (activeTournament && !activeTournament.finishedAt) return;
    setMemberAvail(prev => ({ ...prev, [id]: prev[id] === false ? true : false }));
  }, [activeTournament]);

  // --- Generate pairs & start tournament ---
  const generateAndStart = useCallback(() => {
    const minPlayers = tFormat === 'roundrobin' ? 6 : 4;
    if (availableMembers.length < minPlayers) return;
    const bFn = balanceElo ? balancedPairs : null;
    const t = tFormat === 'roundrobin'
      ? createRoundRobinTournament(availableMembers, tSetupTarget, tSetupServe, bFn)
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

  // --- BroadcastChannel for live spectator ---
  useEffect(() => {
    if (!window.BroadcastChannel) return;
    channelRef.current = new BroadcastChannel('tt-counter-live');
    return () => channelRef.current?.close();
  }, []);

  useEffect(() => {
    if (liveOn && screen === 'game' && channelRef.current) {
      channelRef.current.postMessage({ type: 'game', scoreA, scoreB, serving, teamA: settings.teamA, teamB: settings.teamB, target: settings.targetScore, deuceCount, elapsed, streak });
    }
  }, [liveOn, screen, scoreA, scoreB, serving, settings, deuceCount, elapsed, streak]);

  useEffect(() => {
    if (!channelRef.current) return;
    const handler = (e) => {
      if (e.data.type === 'game' && screen !== 'game') {
        // Auto-spectate: show received scores on game screen
      }
    };
    channelRef.current.addEventListener('message', handler);
    return () => channelRef.current?.removeEventListener('message', handler);
  }, [screen]);

  // --- Voice scoring ---
  const toggleVoice = useCallback(async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (voiceOn) { recognitionRef.current?.stop(); recognitionRef.current = null; setVoiceOn(false); return; }
    // Request mic permission first (triggers browser prompt)
    try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); stream.getTracks().forEach(t => t.stop()); }
    catch { return; } // user denied mic
    const r = new SR(); r.continuous = true; r.interimResults = false; r.lang = 'en-US';
    r.onresult = (e) => {
      const t = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      if (t.includes('up') || t.includes('one') || t.includes('left')) addPoint('a');
      else if (t.includes('down') || t.includes('two') || t.includes('right')) addPoint('b');
      else if (t.includes('undo') || t.includes('back')) undo();
    };
    r.onerror = () => {};
    r.onend = () => { if (recognitionRef.current) { try { r.start(); } catch {} } };
    try { r.start(); recognitionRef.current = r; setVoiceOn(true); } catch { /* unsupported */ }
  }, [voiceOn, addPoint, undo]);

  // --- Export / Import ---
  const handleExport = useCallback(() => {
    const data = { history: loadHistory(), settings: loadSettings(), members: loadMembers(), activeTournament: loadActiveTournament(), tournamentHistory: loadTournamentHistory(), elo: getAllElo(), theme, v: 1 };
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
        if (d.history) { saveHistory(d.history); setHistory(d.history); }
        if (d.settings) { saveSettings(d.settings); setSettings(prev => ({ ...prev, ...d.settings })); }
        if (d.members) { saveMembers(d.members); setMembers(d.members); const a = {}; d.members.forEach(m => { a[m.id] = true; }); setMemberAvail(a); }
        if (d.activeTournament) { saveActiveTournament(d.activeTournament); setActiveTournament(d.activeTournament); }
        if (d.tournamentHistory) { saveTournamentHistory(d.tournamentHistory); setTournamentHistory(d.tournamentHistory); }
        if (d.elo) localStorage.setItem('tt_elo', JSON.stringify(d.elo));
        if (d.theme) { setTheme(d.theme); }
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
  }, []);

  const handleSyncImport = useCallback(() => {
    if (!syncData) return;
    if (syncData.m) { setMembers(syncData.m); saveMembers(syncData.m); const a = {}; syncData.m.forEach(mb => { a[mb.id] = true; }); setMemberAvail(a); }
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

  return (
    <>
      {/* SETUP */}
      <div className={`${screenClass('setup')} setup-screen`}>
        <div className="setup-container">
          <div className="setup-logo">
            <div className="setup-ball" />
            <h1 className="setup-title">TT Counter</h1>
            <p className="setup-subtitle">Table Tennis Scorer</p>
          </div>
          <div className="setup-section">
            <label className="setup-label">Game Mode</label>
            <div className="pill-group">
              {[11,21].map(v => <button key={v} className={`pill ${setupTarget===v?'active':''}`} onClick={() => setSetupTarget(v)}>{v} pts</button>)}
            </div>
          </div>
          <div className="setup-section">
            <label className="setup-label">Serve Rotation</label>
            <div className="pill-group">
              {[2,5].map(v => <button key={v} className={`pill ${setupServe===v?'active':''}`} onClick={() => setSetupServe(v)}>Every {v}</button>)}
            </div>
          </div>
          <div className="setup-section">
            <label className="setup-label">Team Names</label>
            <div className="setup-names">
              <div className="name-field"><span className="name-dot dot-a"/><input className="name-input" value={setupNameA} onChange={e=>setSetupNameA(e.target.value)} maxLength={12} placeholder="Team A"/></div>
              <div className="name-field"><span className="name-dot dot-b"/><input className="name-input" value={setupNameB} onChange={e=>setSetupNameB(e.target.value)} maxLength={12} placeholder="Team B"/></div>
            </div>
          </div>
          <button className="btn btn-start" onClick={() => startGame(setupTarget, setupServe, setupNameA.trim()||'Team A', setupNameB.trim()||'Team B')}><IconPlay/> Start Game</button>
          <div className="setup-links">
            <button className="btn btn-ghost btn-history-link" onClick={() => goTo('teams')}><IconUsers/> Teams</button>
            <button className="btn btn-ghost btn-history-link" onClick={() => goTo('history')}><IconHistory/> History</button>
          </div>
        </div>
      </div>

      {/* TEAMS */}
      <div className={`${screenClass('teams')} teams-screen`}>
        <div className="teams-header">
          <button className="btn btn-ghost" onClick={() => goTo('setup')}><IconBack/> Back</button>
          <h2>Teams</h2>
          <div style={{width:40}}/>
        </div>

        <div className="teams-body">
          <div className="teams-add">
            <input
              className="teams-add-input"
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMember()}
              maxLength={12}
              placeholder="Player name"
            />
            <button className="btn btn-primary teams-add-btn" onClick={addMember}><IconPlus/></button>
          </div>

          <div className="teams-list">
            {members.length === 0 ? (
              <div className="teams-empty">Add players to get started</div>
            ) : members.map((m, i) => (
              <div key={m.id} className={`member-card ${memberAvail[m.id] !== false ? '' : 'unavailable'}`} style={{animationDelay:`${i*.04}s`}}>
                <div className={`member-check ${memberAvail[m.id] !== false ? 'checked' : ''}`} onClick={() => toggleAvail(m.id)}>
                  {memberAvail[m.id] !== false && <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                </div>
                <span className="member-name">{m.name}</span>
                <span className="member-elo">{getElo(m.id)}</span>
                {getPlayerBadges(m.id).length > 0 && <span className="member-badges">{getPlayerBadges(m.id).length}</span>}
                <button className="btn btn-delete-sm" onClick={() => deleteMember(m.id)}><IconDelete/></button>
              </div>
            ))}
          </div>

          {members.length >= 4 && (
            <div className="t-setup-section">
              <label className="setup-label">Tournament Settings</label>
              <div className="t-setup-row">
                <div className="pill-group">
                  {[11,21].map(v => <button key={v} className={`pill pill-sm ${tSetupTarget===v?'active':''}`} onClick={() => setTSetupTarget(v)}>{v} pts</button>)}
                </div>
                <div className="pill-group">
                  {[2,5].map(v => <button key={v} className={`pill pill-sm ${tSetupServe===v?'active':''}`} onClick={() => setTSetupServe(v)}>Serve {v}</button>)}
                </div>
              </div>
              <div className="t-setup-row">
                <div className="pill-group">
                  <button className={`pill pill-sm ${tFormat==='koth'?'active':''}`} onClick={() => setTFormat('koth')}>King of Hill</button>
                  <button className={`pill pill-sm ${tFormat==='roundrobin'?'active':''}`} onClick={() => setTFormat('roundrobin')}>Round Robin</button>
                </div>
              </div>
              <div className="t-setup-row" style={{alignItems:'center',gap:10}}>
                <div className={`member-check ${balanceElo?'checked':''}`} onClick={() => setBalanceElo(b => !b)} style={{width:22,height:22}}>
                  {balanceElo && <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                </div>
                <span style={{fontSize:13,fontWeight:600,color:'var(--dim)'}}>Balance pairs by ELO</span>
              </div>
            </div>
          )}

          {playerStats.length > 0 && (
            <div className="player-stats-section">
              <label className="setup-label">Player Stats</label>
              {playerStats.map((ps, i) => (
                <div key={ps.id} className="player-stat-row">
                  <span className="player-rank">#{i+1}</span>
                  <span className="player-stat-name">{ps.name}</span>
                  <div className="player-stat-nums">
                    <span className="stat-w">{ps.won}W</span>
                    <span className="stat-l">{ps.lost}L</span>
                    {ps.tournamentWins > 0 && <span className="stat-trophy">{ps.tournamentWins}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="teams-footer">
          <div className="teams-avail">{availableMembers.length} of {members.length} available</div>
          {activeTournament && !activeTournament.finishedAt ? (
            <button className="btn btn-primary teams-go-btn" onClick={() => goTo('tournament')}>
              <IconTrophy/> Continue Tournament
            </button>
          ) : (
            <button className="btn btn-primary teams-go-btn" onClick={generateAndStart} disabled={availableMembers.length < (tFormat === 'roundrobin' ? 6 : 4)}>
              <IconShuffle/> Generate Pairs & Play
            </button>
          )}
          {availableMembers.length < (tFormat === 'roundrobin' ? 6 : 4) && !(activeTournament && !activeTournament.finishedAt) && (
            <div className="teams-hint">Need at least {tFormat === 'roundrobin' ? 6 : 4} available players</div>
          )}
        </div>
      </div>

      {/* TOURNAMENT */}
      <div className={`${screenClass('tournament')} tournament-screen`}>
        <div className="tournament-header">
          <button className="btn btn-ghost" onClick={() => goTo('teams')}><IconBack/> Back</button>
          <h2>Tournament</h2>
          <button className="btn btn-ghost" onClick={activeTournament?.finishedAt ? handleShareResults : handleShareSync}><IconShare/></button>
        </div>
        {shareMsg && <div className="share-toast">{shareMsg}</div>}

        <div className="tournament-body">
          {/* Dopamine Winner */}
          {activeTournament?.finishedAt && championPair && (
            <div className="dopamine-winner">
              <div className="dw-trophy">&#x1F3C6;</div>
              <div className="dw-label">DOPAMINE WINNER</div>
              <div className="dw-team">{championPair.name}</div>
            </div>
          )}

          {/* Current Champion (KOTH only) */}
          {championPair && !activeTournament?.finishedAt && activeTournament?.format === 'koth' && (
            <div className="champion-banner">
              <span className="champion-crown">&#x1F451;</span>
              <div className="champion-info">
                <span className="champion-label">Champion</span>
                <span className="champion-name">{championPair.name}</span>
              </div>
            </div>
          )}

          {/* Standby Pick (KOTH only) */}
          {activeTournament?.format === 'koth' && activeTournament?.pendingPick && (() => {
            const { standbyPlayer, losingPairId } = activeTournament.pendingPick;
            const losingPair = activeTournament.pairs.find(p => p.id === losingPairId);
            if (!losingPair) return null;
            return (
              <div className="pick-card">
                <div className="pick-icon">&#x1F504;</div>
                <div className="pick-title">{standbyPlayer.name}, pick your partner</div>
                <div className="pick-subtitle">Choose from the losing team</div>
                <div className="pick-options">
                  {losingPair.players.map(pl => (
                    <button key={pl.id} className="btn btn-pick" onClick={() => handleStandbyPick(pl.id)}>
                      {pl.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Next Match (KOTH only) */}
          {activeTournament?.format === 'koth' && nextMatch && !activeTournament?.pendingPick && !activeTournament?.finishedAt && (
            <div className="next-match-card">
              <div className="nm-label">{activeTournament?.currentChampion ? 'Next Match' : 'First Match'}</div>
              <div className="nm-teams">
                <div className="nm-team">
                  <span className="nm-name">{nextMatch.pairA.name}</span>
                  {activeTournament?.currentChampion === nextMatch.pairA.id && <span className="nm-badge">Champ</span>}
                </div>
                <span className="nm-vs">VS</span>
                <div className="nm-team">
                  <span className="nm-name">{nextMatch.pairB.name}</span>
                  {activeTournament?.currentChampion === nextMatch.pairB.id && <span className="nm-badge">Champ</span>}
                </div>
              </div>
              <button className="btn btn-play-match" onClick={playNextMatch}><IconPlay/> Play Match</button>
            </div>
          )}

          {/* Round Robin matches */}
          {activeTournament?.format === 'roundrobin' && !activeTournament.finishedAt && (
            <div className="match-history-list">
              {activeTournament.matches.map((m, i) => {
                const pA = activeTournament.pairs.find(p => p.id === m.pairAId);
                const pB = activeTournament.pairs.find(p => p.id === m.pairBId);
                return (
                  <div key={m.id} className={`match-card ${m.finished?'done':''}`}>
                    <div className="match-num">Match {i+1}</div>
                    <div className="match-teams">
                      <div className={`match-team ${m.winner===m.pairAId?'winner':''}`}>
                        <span className="match-team-name">{pA?.name||'?'}</span>
                        {m.finished && <span className="match-team-score">{m.scoreA}</span>}
                      </div>
                      <span className="match-vs">VS</span>
                      <div className={`match-team ${m.winner===m.pairBId?'winner':''}`}>
                        <span className="match-team-name">{pB?.name||'?'}</span>
                        {m.finished && <span className="match-team-score">{m.scoreB}</span>}
                      </div>
                    </div>
                    {!m.finished && <button className="btn btn-play-match" onClick={() => startRRMatch(m)}><IconPlay/> Play</button>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Queue + Standby (KOTH only) */}
          {activeTournament && activeTournament.format !== 'roundrobin' && !activeTournament.finishedAt && (activeTournament.queue?.length > 0 || activeTournament.standby) && (
            <div className="queue-section">
              <label className="setup-label">Waiting</label>
              <div className="queue-chips">
                {activeTournament.queue.map(qid => {
                  const p = activeTournament.pairs.find(pp => pp.id === qid);
                  return p ? <div key={qid} className="queue-chip">{p.name}</div> : null;
                })}
                {activeTournament.standby && !activeTournament.pendingPick && (
                  <div className="queue-chip standby-chip">Standby: {activeTournament.standby.name}</div>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          {activeTournament && activeTournament.matches.length > 0 && (
            <>
              <div className="tab-bar-inline">
                <button className={`tab ${tournamentTab==='history'?'active':''}`} onClick={() => setTournamentTab('history')}>Matches</button>
                <button className={`tab ${tournamentTab==='standings'?'active':''}`} onClick={() => setTournamentTab('standings')}>Standings</button>
              </div>

              {tournamentTab === 'history' && (
                <div className="match-history-list">
                  {[...activeTournament.matches].reverse().map((m, i) => {
                    const pA = activeTournament.pairs.find(p => p.id === m.pairAId);
                    const pB = activeTournament.pairs.find(p => p.id === m.pairBId);
                    return (
                      <div key={m.id} className="match-card done" style={{animationDelay:`${i*.04}s`}}>
                        <div className="match-num">Match {activeTournament.matches.length - i}</div>
                        <div className="match-teams">
                          <div className={`match-team ${m.winner===m.pairAId?'winner':''}`}>
                            <span className="match-team-name">{pA?.name || '?'}</span>
                            <span className="match-team-score">{m.scoreA}</span>
                          </div>
                          <span className="match-vs">VS</span>
                          <div className={`match-team ${m.winner===m.pairBId?'winner':''}`}>
                            <span className="match-team-name">{pB?.name || '?'}</span>
                            <span className="match-team-score">{m.scoreB}</span>
                          </div>
                        </div>
                        {m.deuceCount > 0 && <div className="match-deuce">{m.deuceCount} deuce{m.deuceCount>1?'s':''}</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {tournamentTab === 'standings' && (
                <div className="standings-wrap">
                  <table className="standings-table">
                    <thead>
                      <tr><th>#</th><th className="st-team">Team</th><th>P</th><th>W</th><th>L</th><th>PF</th><th>PA</th><th>+/-</th></tr>
                    </thead>
                    <tbody>
                      {standings.map((s, i) => (
                        <tr key={s.pairId} className={i===0 && s.won > 0 ?'top-row':''}>
                          <td className="st-rank">{i+1}</td>
                          <td className="st-team">{s.name}</td>
                          <td>{s.played}</td>
                          <td className="st-w">{s.won}</td>
                          <td className="st-l">{s.lost}</td>
                          <td>{s.pf}</td>
                          <td>{s.pa}</td>
                          <td className={s.pf-s.pa>0?'st-pos':s.pf-s.pa<0?'st-neg':''}>{s.pf-s.pa>0?'+':''}{s.pf-s.pa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="chart-section">
                    <label className="setup-label">Wins</label>
                    {standings.map(s => (
                      <div key={s.pairId} className="chart-row">
                        <span className="chart-label">{s.name}</span>
                        <div className="chart-bar-bg">
                          <div className="chart-bar" style={{width: `${(s.won/maxWins)*100}%`}}/>
                        </div>
                        <span className="chart-value">{s.won}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="tournament-footer">
          {activeTournament?.finishedAt ? (
            <button className="btn btn-primary tournament-foot-btn" onClick={finishAndArchive}><IconShuffle/> New Tournament</button>
          ) : (
            <div className="tournament-foot-row">
              <button className="btn btn-ghost tournament-foot-btn" onClick={discardTournament}><IconDelete/> Discard</button>
              {activeTournament?.format === 'roundrobin' && activeTournament?.matches.some(m => m.finished) && (
                <button className="btn btn-primary tournament-foot-btn" onClick={endRRTournament}><IconStop/> End Tournament</button>
              )}
              {activeTournament?.format !== 'roundrobin' && activeTournament?.matches.length > 0 && (
                <button className="btn btn-primary tournament-foot-btn" onClick={endTournament}><IconStop/> End &amp; Crown</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* GAME */}
      <div className={`${screenClass('game')} game-screen`}>
        <div className="scoreboard">
          <div className="team-panel team-a" onClick={() => addPoint('a')}>
            <div className={`serve-indicator ${serving==='a'?'active':''}`}><div className="serve-dot"/><span className="serve-count">{serving==='a'?`${servesLeft} left`:''}</span></div>
            <div className="team-content">
              <span className="team-label">{settings.teamA}</span>
              <span className={`score ${bumpTeam==='a'?'bump':''}`}>{scoreA}</span>
              <span className="vol-hint">TAP or VOL UP</span>
            </div>
          </div>
          <div className="divider"><div className="vs-badge">VS</div></div>
          <div className={`deuce-banner ${deuceFlash?'show':''}`}>DEUCE!{deuceCount > 0 ? ` (${deuceCount})` : ''}</div>
          <div className="team-panel team-b" onClick={() => addPoint('b')}>
            <div className={`serve-indicator ${serving==='b'?'active':''}`}><div className="serve-dot"/><span className="serve-count">{serving==='b'?`${servesLeft} left`:''}</span></div>
            <div className="team-content">
              <span className="team-label">{settings.teamB}</span>
              <span className={`score ${bumpTeam==='b'?'bump':''}`}>{scoreB}</span>
              <span className="vol-hint">TAP or VOL DOWN</span>
            </div>
          </div>
        </div>
        {streak.count >= 3 && <div className="streak-banner">{streak.count} in a row!</div>}
        <div className="bottom-bar">
          <button className="btn btn-ghost" onClick={undo}><IconUndo/> Undo</button>
          <div className="game-info">
            <span className="game-timer">{formatDuration(elapsed)}</span>
            {deuceCount > 0 && <> &bull; Deuce: {deuceCount}</>}
            {voiceOn && <span className="voice-dot" title="Voice active"/>}
            {liveOn && <span className="live-dot" title="Broadcasting"/>}
          </div>
          <button className="btn btn-ghost" onClick={() => goTo('history')}><IconHistory/></button>
        </div>
      </div>

      {/* WIN */}
      <div className={`${screenClass('win')} win-screen`}>
        <div className="win-crown">{'\u{1F451}'}</div>
        <div className={`win-title winner-${winner||'a'}`}>{winner==='a'?settings.teamA:settings.teamB} Wins!</div>
        <div className="win-score"><span className="wa">{scoreA}</span> <span style={{color:'var(--dim)'}}>-</span> <span className="wb">{scoreB}</span></div>
        <div className="win-details">
          Total Points: {scoreA+scoreB}{deuceCount > 0 && <> &bull; Deuces: {deuceCount}</>}<br/>
          Duration: {startedAt?formatDuration(Date.now()-startedAt):'\u2014'}
          {pointLogRef.current.length > 0 && (() => {
            let maxS = 0, cur = 0, lastT = null;
            pointLogRef.current.forEach(p => { if (p.team === lastT) { cur++; maxS = Math.max(maxS, cur); } else { cur = 1; lastT = p.team; } });
            maxS = Math.max(maxS, cur);
            return maxS >= 3 ? <><br/>Best streak: {maxS} in a row</> : null;
          })()}
        </div>
        {pointLogRef.current.length > 2 && (
          <svg viewBox="0 0 200 60" className="momentum-svg">
            <line x1="0" y1="30" x2="200" y2="30" stroke="var(--dim)" strokeWidth="0.5" strokeDasharray="2"/>
            <polyline fill="none" stroke="var(--a)" strokeWidth="1.5" strokeLinejoin="round"
              points={pointLogRef.current.map((p, i) => `${(i/(pointLogRef.current.length-1))*200},${30-(p.scoreA-p.scoreB)*2}`).join(' ')}/>
          </svg>
        )}
        <div className="win-actions">
          {tournamentMatchId ? (
            <button className="btn btn-primary" onClick={backToTournament}><IconTrophy/> Back to Tournament</button>
          ) : (
            <button className="btn btn-primary" onClick={goSetup}><IconNew/> New Game</button>
          )}
          <button className="btn btn-outline" onClick={() => goTo('history')}><IconHistory/> View History</button>
        </div>
      </div>

      {/* HISTORY */}
      <div className={`${screenClass('history')} history-screen`}>
        <div className="history-header">
          <button className="btn btn-ghost" onClick={() => goTo(['win','game','tournament'].includes(prevScreen)?prevScreen:'setup')}><IconBack/> Back</button>
          <h2>Game History</h2>
          <button className="btn btn-ghost" onClick={() => setShowSettings(true)}><IconSettings/></button>
        </div>
        <div className="history-list">
          {history.length===0 ? (
            <div className="history-empty">
              <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              <div>No games yet</div>
              <div style={{fontSize:12}}>Start a game and it'll show up here</div>
            </div>
          ) : history.map((g,i) => (
            <div key={g.id} className={`game-card ${!g.finished?'in-progress':''}`} style={{animationDelay:`${i*.05}s`}}>
              <div className="game-card-header">
                <span className="game-card-date">{fmtDate(g.startedAt)} &bull; {g.finishedAt?formatDuration(g.finishedAt-g.startedAt):g.updatedAt?formatDuration(g.updatedAt-g.startedAt):'\u2014'}</span>
                <span className={`game-card-badge ${!g.finished?'badge-live':'badge-done'}`}>{!g.finished?'In Progress':'Finished'}</span>
              </div>
              <div className="game-card-scores">
                <div className={`game-card-team a ${g.winner==='a'?'winner':''}`}><span className="game-card-team-label">{g.teamA}{g.winner==='a'?' \u2605':''}</span><span className="game-card-team-score">{g.scoreA}</span></div>
                <span className="game-card-vs">VS</span>
                <div className={`game-card-team b ${g.winner==='b'?'winner':''}`}><span className="game-card-team-label">{g.teamB}{g.winner==='b'?' \u2605':''}</span><span className="game-card-team-score">{g.scoreB}</span></div>
              </div>
              <div className="game-card-mode">{g.targetScore||'?'} pts &bull; serve every {g.serveInterval||'?'}{g.deuceCount > 0 && <> &bull; Deuces: {g.deuceCount}</>}</div>
              <div className="game-card-actions">
                {!g.finished && <button className="btn btn-continue" onClick={() => continueGame(g)}>Continue from here</button>}
                <button className="btn btn-delete" onClick={e => { e.stopPropagation(); deleteGame(g.id); }}><IconDelete/></button>
              </div>
            </div>
          ))}
        </div>
        <div className="history-footer">
          <button className="btn btn-primary" onClick={goSetup}><IconPlus/> Start New Game</button>
        </div>
      </div>

      {/* SETTINGS */}
      <div className={`modal-overlay ${showSettings?'show':''}`} onClick={e => { if (e.target===e.currentTarget) setShowSettings(false); }}>
        <div className="modal">
          <div className="modal-handle"/>
          <h3>Settings</h3>
          <div className="setting-row">
            <div><div className="setting-label">Vibration</div><div className="setting-desc">Haptic feedback on score</div></div>
            <div className={`toggle ${settings.vibrate?'on':''}`} onClick={() => { const n={...settings,vibrate:!settings.vibrate}; setSettings(n); saveSettings(n); }}/>
          </div>
          <div className="setting-row">
            <div><div className="setting-label">Sound Effects</div><div className="setting-desc">Beeps on score, deuce &amp; win</div></div>
            <div className={`toggle ${settings.sound?'on':''}`} onClick={() => { const n={...settings,sound:!settings.sound}; setSettings(n); saveSettings(n); }}/>
          </div>
          <div className="setting-row">
            <div><div className="setting-label">Dark Mode</div><div className="setting-desc">Toggle light / dark theme</div></div>
            <div className={`toggle ${theme==='dark'?'on':''}`} onClick={() => setTheme(t => t==='dark'?'light':'dark')}/>
          </div>
          <div className="setting-row">
            <div><div className="setting-label">Voice Scoring</div><div className="setting-desc">Say "up"/"down" to score</div></div>
            <div className={`toggle ${voiceOn?'on':''}`} onClick={toggleVoice}/>
          </div>
          <div className="setting-row">
            <div><div className="setting-label">Live Broadcast</div><div className="setting-desc">Share scores to other tabs</div></div>
            <div className={`toggle ${liveOn?'on':''}`} onClick={() => setLiveOn(l => !l)}/>
          </div>
          <div className="setting-row setting-row-btns">
            <button className="btn btn-outline btn-export" onClick={handleExport}><IconDownload/> Export</button>
            <button className="btn btn-outline btn-export" onClick={() => importRef.current?.click()}><IconUpload/> Import</button>
            <input ref={importRef} type="file" accept=".json" style={{display:'none'}} onChange={handleImport}/>
          </div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:20,padding:14,fontSize:15}} onClick={() => setShowSettings(false)}>Done</button>
        </div>
      </div>

      {/* SYNC MODAL */}
      <div className={`modal-overlay ${syncData?'show':''}`} onClick={e => { if (e.target===e.currentTarget) setSyncData(null); }}>
        <div className="modal">
          <div className="modal-handle"/>
          <h3>Sync Tournament Scores?</h3>
          <div className="sync-info">
            <div className="sync-detail">Someone shared a tournament with you</div>
            {syncData?.t && <div className="sync-detail">{syncData.t.matches?.length || 0} matches played &bull; {syncData.t.pairs?.length || 0} teams</div>}
            {syncData?.t?.finishedAt && <div className="sync-detail sync-finished">Tournament finished</div>}
          </div>
          <div className="sync-actions">
            <button className="btn btn-primary" style={{flex:1,justifyContent:'center',padding:14,fontSize:15}} onClick={handleSyncImport}>Import & View</button>
            <button className="btn btn-outline" style={{flex:1,justifyContent:'center',padding:14,fontSize:15}} onClick={() => setSyncData(null)}>Cancel</button>
          </div>
        </div>
      </div>

      <canvas ref={confettiRef} className="confetti-canvas"/>
    </>
  );
}
