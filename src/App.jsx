import { useState, useEffect, useRef, useCallback } from 'react'
import { calcServe, calcServeRemaining, isDeuce, getWinner, formatDuration } from './gameLogic'
import { soundScore, soundDeuce, soundWin, soundUndo, vib, ensureAudio } from './audio'
import { loadHistory, saveHistory, loadSettings, saveSettings } from './storage'
import { fireConfetti } from './confetti'

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const IconPlay = () => <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const IconUndo = () => <svg viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>;
const IconHistory = () => <svg viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>;
const IconBack = () => <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;
const IconNew = () => <svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>;
const IconPlus = () => <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const IconDelete = () => <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const IconSettings = () => <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/></svg>;

export default function App() {
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

  const undoStack = useRef([]);
  const confettiRef = useRef(null);
  const stateRef = useRef();
  stateRef.current = { scoreA, scoreB, serving, screen, settings, gameId, startedAt };

  const winner = getWinner(scoreA, scoreB, settings.targetScore);
  const deuce = isDeuce(scoreA, scoreB, settings.targetScore);
  const servesLeft = calcServeRemaining(scoreA, scoreB, settings.targetScore, settings.serveInterval);

  const goTo = useCallback((next) => { setScreen(prev => { setPrevScreen(prev); return next; }); }, []);

  const screenClass = (name) => {
    if (screen === name) return 'screen';
    const order = ['setup','history','game','win'];
    return order.indexOf(name) < order.indexOf(screen) ? 'screen hidden-left' : 'screen hidden';
  };

  const autoSave = useCallback((sA, sB, gId, sAt, w = null, finished = false) => {
    if (!gId) return;
    setHistory(prev => {
      const idx = prev.findIndex(h => h.id === gId);
      const s = stateRef.current.settings;
      const entry = { id: gId, teamA: s.teamA, teamB: s.teamB, scoreA: sA, scoreB: sB, targetScore: s.targetScore, serveInterval: s.serveInterval, startedAt: sAt, updatedAt: Date.now(), winner: w, finished, ...(finished ? { finishedAt: Date.now() } : {}) };
      let next; if (idx >= 0) { next = [...prev]; next[idx] = { ...prev[idx], ...entry }; } else { next = [entry, ...prev]; }
      saveHistory(next); return next;
    });
  }, []);

  const addPoint = useCallback((team) => {
    const s = stateRef.current;
    if (s.screen !== 'game' || getWinner(s.scoreA, s.scoreB, s.settings.targetScore)) return;
    undoStack.current.push({ scoreA: s.scoreA, scoreB: s.scoreB, serving: s.serving });
    if (undoStack.current.length > 100) undoStack.current.shift();
    const nA = team === 'a' ? s.scoreA+1 : s.scoreA;
    const nB = team === 'b' ? s.scoreB+1 : s.scoreB;
    const nServe = calcServe(nA, nB, s.settings.targetScore, s.settings.serveInterval);
    setScoreA(nA); setScoreB(nB); setServing(nServe);
    if (s.settings.vibrate) vib();
    if (s.settings.sound) soundScore();
    setBumpTeam(team); setTimeout(() => setBumpTeam(null), 300);
    const w = getWinner(nA, nB, s.settings.targetScore);
    autoSave(nA, nB, s.gameId, s.startedAt, w, !!w);
    if (isDeuce(nA, nB, s.settings.targetScore)) setTimeout(() => { if (s.settings.sound) soundDeuce(); if (s.settings.vibrate) vib(30); }, 200);
    if (w) setTimeout(() => { if (s.settings.sound) soundWin(); if (s.settings.vibrate) vib([50,50,50,50,100]); goTo('win'); fireConfetti(confettiRef.current); }, 500);
  }, [autoSave, goTo]);

  const undo = useCallback(() => {
    if (!undoStack.current.length) return;
    const prev = undoStack.current.pop();
    setScoreA(prev.scoreA); setScoreB(prev.scoreB); setServing(prev.serving);
    const s = stateRef.current;
    if (s.settings.vibrate) vib(8);
    if (s.settings.sound) soundUndo();
    autoSave(prev.scoreA, prev.scoreB, s.gameId, s.startedAt);
  }, [autoSave]);

  const startGame = useCallback((target, serve, nameA, nameB) => {
    const ns = { ...stateRef.current.settings, targetScore: target, serveInterval: serve, teamA: nameA, teamB: nameB };
    setSettings(ns); saveSettings(ns);
    setScoreA(0); setScoreB(0); setServing('a'); setGameId(genId()); setStartedAt(Date.now());
    undoStack.current = []; goTo('game');
  }, [goTo]);

  const continueGame = useCallback((g) => {
    const ns = { ...stateRef.current.settings, targetScore: g.targetScore, serveInterval: g.serveInterval||2, teamA: g.teamA, teamB: g.teamB };
    setSettings(ns); saveSettings(ns);
    setScoreA(g.scoreA); setScoreB(g.scoreB); setServing(calcServe(g.scoreA, g.scoreB, g.targetScore, g.serveInterval||2));
    setGameId(g.id); setStartedAt(g.startedAt); undoStack.current = []; goTo('game');
  }, [goTo]);

  const deleteGame = useCallback((id) => { setHistory(prev => { const n = prev.filter(h => h.id !== id); saveHistory(n); return n; }); }, []);

  const goSetup = useCallback(() => {
    const s = stateRef.current.settings;
    setSetupTarget(s.targetScore); setSetupServe(s.serveInterval); setSetupNameA(s.teamA); setSetupNameB(s.teamB); goTo('setup');
  }, [goTo]);

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
          <button className="btn btn-ghost btn-history-link" onClick={() => goTo('history')}><IconHistory/> Game History</button>
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
          <div className={`deuce-banner ${deuce?'show':''}`}>DEUCE!</div>
          <div className="team-panel team-b" onClick={() => addPoint('b')}>
            <div className={`serve-indicator ${serving==='b'?'active':''}`}><div className="serve-dot"/><span className="serve-count">{serving==='b'?`${servesLeft} left`:''}</span></div>
            <div className="team-content">
              <span className="team-label">{settings.teamB}</span>
              <span className={`score ${bumpTeam==='b'?'bump':''}`}>{scoreB}</span>
              <span className="vol-hint">TAP or VOL DOWN</span>
            </div>
          </div>
        </div>
        <div className="bottom-bar">
          <button className="btn btn-ghost" onClick={undo}><IconUndo/> Undo</button>
          <div className="game-info"><span>{settings.targetScore}</span> pts &bull; serve every <span>{settings.serveInterval}</span></div>
          <button className="btn btn-ghost" onClick={() => goTo('history')}><IconHistory/> History</button>
        </div>
      </div>

      {/* WIN */}
      <div className={`${screenClass('win')} win-screen`}>
        <div className="win-crown">{'\u{1F451}'}</div>
        <div className={`win-title winner-${winner||'a'}`}>{winner==='a'?settings.teamA:settings.teamB} Wins!</div>
        <div className="win-score"><span className="wa">{scoreA}</span> <span style={{color:'var(--dim)'}}>-</span> <span className="wb">{scoreB}</span></div>
        <div className="win-details">Total Points: {scoreA+scoreB}<br/>Duration: {startedAt?formatDuration(Date.now()-startedAt):'\u2014'}</div>
        <div className="win-actions">
          <button className="btn btn-primary" onClick={goSetup}><IconNew/> New Game</button>
          <button className="btn btn-outline" onClick={() => goTo('history')}><IconHistory/> View History</button>
        </div>
      </div>

      {/* HISTORY */}
      <div className={`${screenClass('history')} history-screen`}>
        <div className="history-header">
          <button className="btn btn-ghost" onClick={() => goTo(prevScreen==='win'||prevScreen==='game'?prevScreen:'setup')}><IconBack/> Back</button>
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
              <div className="game-card-mode">{g.targetScore||'?'} pts &bull; serve every {g.serveInterval||'?'}</div>
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
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:20,padding:14,fontSize:15}} onClick={() => setShowSettings(false)}>Done</button>
        </div>
      </div>

      <canvas ref={confettiRef} className="confetti-canvas"/>
    </>
  );
}
