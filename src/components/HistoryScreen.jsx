import { useApp } from '../context/AppContext'
import { IconBack, IconSettings, IconPlus, IconDelete } from './Icons'
import { formatDuration } from '../gameLogic'

export default function HistoryScreen() {
  const {
    screenClass, goTo, prevScreen, history, fmtDate,
    continueGame, deleteGame, goSetup, setShowSettings, setDetailGame
  } = useApp();

  return (
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
          <div key={g.id} className={`game-card ${!g.finished?'in-progress':''}`} style={{animationDelay:`${i*.05}s`}} onClick={() => g.finished && setDetailGame(g)}>
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
              {!g.finished && <button className="btn btn-continue" onClick={e => { e.stopPropagation(); continueGame(g); }}>Continue</button>}
              <button className="btn btn-delete" onClick={e => { e.stopPropagation(); deleteGame(g.id); }}><IconDelete/></button>
            </div>
          </div>
        ))}
      </div>
      <div className="history-footer">
        <button className="btn btn-primary" onClick={goSetup}><IconPlus/> Start New Game</button>
      </div>
    </div>
  );
}
