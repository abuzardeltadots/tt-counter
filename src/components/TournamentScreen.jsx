import { useApp } from '../context/AppContext'
import { IconBack, IconShare, IconPlay, IconShuffle, IconDelete, IconStop } from './Icons'

export default function TournamentScreen() {
  const {
    screenClass, goTo, activeTournament, shareMsg,
    handleShareSync, handleShareResults, championPair,
    nextMatch, playNextMatch, handleStandbyPick,
    startRRMatch, standings, maxWins, tournamentTab, setTournamentTab,
    finishAndArchive, discardTournament, endTournament, endRRTournament
  } = useApp();

  return (
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

        {/* Knockout Bracket */}
        {activeTournament?.format === 'knockout' && !activeTournament.finishedAt && activeTournament.bracket && (
          <div className="bracket-section">
            {activeTournament.bracket.rounds.map((roundIds, ri) => {
              const roundMatches = roundIds.map(mid => activeTournament.matches.find(m => m.id === mid)).filter(Boolean);
              return (
                <div key={ri} className="bracket-round">
                  <label className="setup-label">Round {ri + 1}{ri === activeTournament.bracket.rounds.length - 1 && roundMatches.length === 1 ? ' — Final' : ''}</label>
                  {roundMatches.map(m => {
                    const pA = activeTournament.pairs.find(p => p.id === m.pairAId);
                    const pB = activeTournament.pairs.find(p => p.id === m.pairBId);
                    return (
                      <div key={m.id} className={`match-card ${m.finished ? 'done' : ''}`}>
                        <div className="match-teams">
                          <div className={`match-team ${m.winner === m.pairAId ? 'winner' : ''}`}>
                            <span className="match-team-name">{pA?.name || '?'}</span>
                            {m.finished && <span className="match-team-score">{m.scoreA}</span>}
                          </div>
                          <span className="match-vs">VS</span>
                          <div className={`match-team ${m.winner === m.pairBId ? 'winner' : ''}`}>
                            <span className="match-team-name">{pB?.name || '?'}</span>
                            {m.finished && <span className="match-team-score">{m.scoreB}</span>}
                          </div>
                        </div>
                        {!m.finished && <button className="btn btn-play-match" onClick={() => startRRMatch(m)}><IconPlay/> Play</button>}
                      </div>
                    );
                  })}
                  {ri === activeTournament.bracket.rounds.length - 1 && activeTournament.bracket.byePair && (
                    <div className="queue-chip" style={{marginTop:6}}>Bye (auto-advances): {activeTournament.pairs.find(p => p.id === activeTournament.bracket.byePair)?.name}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Queue + Standby (KOTH only) */}
        {activeTournament && activeTournament.format === 'koth' && !activeTournament.finishedAt && (activeTournament.queue?.length > 0 || activeTournament.standby) && (
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
            {(activeTournament?.format === 'roundrobin' || activeTournament?.format === 'knockout') && activeTournament?.matches.some(m => m.finished) && (
              <button className="btn btn-primary tournament-foot-btn" onClick={endRRTournament}><IconStop/> End Tournament</button>
            )}
            {activeTournament?.format === 'koth' && activeTournament?.matches.length > 0 && (
              <button className="btn btn-primary tournament-foot-btn" onClick={endTournament}><IconStop/> End &amp; Crown</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
