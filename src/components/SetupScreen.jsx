import { useApp } from '../context/AppContext'
import { IconPlay, IconSettings, IconUsers, IconHistory } from './Icons'

export default function SetupScreen() {
  const {
    screenClass, setupTarget, setSetupTarget, setupServe, setSetupServe,
    setupNameA, setSetupNameA, setupNameB, setSetupNameB,
    startGame, goTo, setShowSettings
  } = useApp();

  return (
    <div className={`${screenClass('setup')} setup-screen`}>
      <button className="setup-settings-btn btn btn-ghost" onClick={() => setShowSettings(true)}><IconSettings/></button>
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
            <div className="name-field"><span className="name-dot dot-a"/><input className="name-input" value={setupNameA} onChange={e=>setSetupNameA(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')e.target.blur()}} maxLength={12} placeholder="Team A"/></div>
            <div className="name-field"><span className="name-dot dot-b"/><input className="name-input" value={setupNameB} onChange={e=>setSetupNameB(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')e.target.blur()}} maxLength={12} placeholder="Team B"/></div>
          </div>
        </div>
        <button className="btn btn-start" onClick={() => startGame(setupTarget, setupServe, setupNameA.trim()||'Team A', setupNameB.trim()||'Team B')}><IconPlay/> Start Game</button>
        <div className="setup-links">
          <button className="btn btn-ghost btn-history-link" onClick={() => goTo('teams')}><IconUsers/> Teams</button>
          <button className="btn btn-ghost btn-history-link" onClick={() => goTo('history')}><IconHistory/> History</button>
        </div>
      </div>
    </div>
  );
}
