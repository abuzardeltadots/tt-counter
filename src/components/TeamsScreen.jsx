import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { PLAYER_COLORS } from '../context/AppContext'
import { IconBack, IconPlus, IconDelete, IconShuffle, IconTrophy, IconHistory, IconShare } from './Icons'
import { getAllElo } from '../elo'

function eloTrend(playerId, tournaments) {
  let recent = [];
  [...tournaments].reverse().forEach(t => {
    t.matches.filter(m => m.finished).forEach(m => {
      const pA = t.pairs.find(p => p.id === m.pairAId);
      const pB = t.pairs.find(p => p.id === m.pairBId);
      if (!pA || !pB) return;
      const inA = pA.players.some(p => p.id === playerId);
      const inB = pB.players.some(p => p.id === playerId);
      if (inA) recent.push(m.winner === m.pairAId ? 1 : -1);
      else if (inB) recent.push(m.winner === m.pairBId ? 1 : -1);
    });
  });
  const last5 = recent.slice(-5);
  if (last5.length < 2) return 0;
  const sum = last5.reduce((a, b) => a + b, 0);
  return sum > 1 ? 1 : sum < -1 ? -1 : 0; // 1=up, -1=down, 0=neutral
}

export default function TeamsScreen() {
  const [h2hSelect, setH2hSelect] = useState(null);
  const {
    screenClass, goTo, members, memberAvail, newMemberName, setNewMemberName,
    addMember, deleteMember, toggleAvail, activeTournament,
    tSetupTarget, setTSetupTarget, tSetupServe, setTSetupServe,
    tFormat, setTFormat, balanceElo, setBalanceElo,
    availableMembers, generateAndStart, playerStats, allTournaments,
    tournamentHistory, setShowPastTournaments, getElo, getPlayerBadges,
    setH2hPlayers, setShowSeasons, seasons, shareInviteLink, shareWeeklyDigest
  } = useApp();

  return (
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
              <span className="member-avatar" style={{background: PLAYER_COLORS[i % PLAYER_COLORS.length]}}/>
              <span className="member-name">{m.name}</span>
              <span className="member-elo">
                {getElo(m.id)}
                {(() => { const t = eloTrend(m.id, allTournaments); return t === 1 ? <span className="elo-up"/> : t === -1 ? <span className="elo-down"/> : null; })()}
              </span>
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
                <button className={`pill pill-sm ${tFormat==='knockout'?'active':''}`} onClick={() => setTFormat('knockout')}>Knockout</button>
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
            <label className="setup-label">Player Stats <span style={{fontSize:10,color:'var(--dim)',fontWeight:400}}>(tap two to compare)</span></label>
            {playerStats.map((ps, i) => (
              <div key={ps.id} className={`player-stat-row ${h2hSelect === ps.id ? 'h2h-selected' : ''}`} onClick={() => {
                if (!h2hSelect) setH2hSelect(ps.id);
                else if (h2hSelect === ps.id) setH2hSelect(null);
                else { setH2hPlayers({ a: h2hSelect, b: ps.id }); setH2hSelect(null); }
              }}>
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

        {/* Seasons button */}
        <button className="btn btn-ghost" style={{fontSize:12,alignSelf:'center'}} onClick={() => setShowSeasons(true)}>
          <IconTrophy/> Seasons ({seasons.length})
        </button>
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
        <div className="teams-footer-links">
          {tournamentHistory.length > 0 && <button className="btn btn-ghost btn-footer-link" onClick={() => setShowPastTournaments(true)}><IconHistory/> Tournaments</button>}
          {members.length >= 4 && <button className="btn btn-ghost btn-footer-link" onClick={shareInviteLink}><IconShare/> Invite</button>}
          <button className="btn btn-ghost btn-footer-link" onClick={shareWeeklyDigest}><IconHistory/> Digest</button>
          <button className="btn btn-ghost btn-footer-link" onClick={() => setShowSeasons(true)}><IconTrophy/> Seasons</button>
        </div>
      </div>
    </div>
  );
}
