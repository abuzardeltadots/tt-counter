import { useApp } from '../context/AppContext'

export default function SpectatorOverlay() {
  const { spectating, leaveSpectator } = useApp();

  if (!spectating) return null;

  return (
    <div className="spectator-overlay">
      <div className="spec-header">
        <span className="spec-live-dot"/>
        <span>LIVE</span>
        <button className="btn btn-ghost btn-sm" onClick={leaveSpectator}>Leave</button>
      </div>
      <div className="spec-scoreboard">
        <div className="spec-team spec-a">
          <div className="spec-name">{spectating.teamA || 'Team A'}</div>
          <div className="spec-score">{spectating.scoreA ?? 0}</div>
          {spectating.serving === 'a' && <div className="spec-serve"/>}
        </div>
        <div className="spec-divider">
          <div className="spec-vs">VS</div>
        </div>
        <div className="spec-team spec-b">
          <div className="spec-name">{spectating.teamB || 'Team B'}</div>
          <div className="spec-score">{spectating.scoreB ?? 0}</div>
          {spectating.serving === 'b' && <div className="spec-serve"/>}
        </div>
      </div>
      <div className="spec-info">
        {spectating.target} pts
        {spectating.deuceCount > 0 && <> &bull; Deuce: {spectating.deuceCount}</>}
        {spectating.streak?.count >= 3 && <> &bull; {spectating.streak.count} in a row!</>}
      </div>
      {spectating.winner && <div className="spec-winner">{spectating.winner==='a'?spectating.teamA:spectating.teamB} Wins!</div>}
    </div>
  );
}
