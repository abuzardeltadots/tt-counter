import { useApp } from '../context/AppContext'
import { IconTrophy, IconNew, IconHistory, IconPlay } from './Icons'
import { formatDuration } from '../gameLogic'

export default function WinScreen() {
  const {
    screenClass, winner, settings, scoreA, scoreB,
    deuceCount, startedAt, pointLogRef, tournamentMatchId,
    backToTournament, goSetup, goTo, quickRematch
  } = useApp();

  return (
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
          <>
            <button className="btn btn-primary" onClick={goSetup}><IconNew/> New Game</button>
            <button className="btn btn-outline" onClick={quickRematch}><IconPlay/> Quick Rematch</button>
          </>
        )}
        <button className="btn btn-outline" onClick={() => goTo('history')}><IconHistory/> View History</button>
      </div>
    </div>
  );
}
