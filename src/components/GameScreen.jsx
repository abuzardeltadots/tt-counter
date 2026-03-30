import { useApp } from '../context/AppContext'
import { IconUndo, IconStop, IconHistory } from './Icons'
import { formatDuration } from '../gameLogic'

export default function GameScreen() {
  const {
    screenClass, settings, scoreA, scoreB, serving, servesLeft,
    bumpTeam, deuceFlash, deuceCount, streak, elapsed,
    addPoint, undo, goTo, goSetup, tournamentMatchId, setTournamentMatchId,
    voiceOn, liveCode
  } = useApp();

  return (
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
        <button className="btn btn-ghost" onClick={undo}><IconUndo/></button>
        <button className="btn btn-ghost btn-stop-game" onClick={() => { if (confirm('Leave this match?')) { if (tournamentMatchId) { setTournamentMatchId(null); goTo('tournament'); } else { goSetup(); } } }}><IconStop/></button>
        <div className="game-info">
          <span className="game-timer">{formatDuration(elapsed)}</span>
          {deuceCount > 0 && <> &bull; {deuceCount}D</>}
          {voiceOn && <span className="voice-dot"/>}
          {liveCode && <span className="live-badge">LIVE {liveCode}</span>}
        </div>
        <button className="btn btn-ghost" onClick={() => goTo('history')}><IconHistory/></button>
      </div>
    </div>
  );
}
