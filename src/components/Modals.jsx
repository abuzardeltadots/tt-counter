import { useApp } from '../context/AppContext'
import { IconSettings, IconLive, IconDownload, IconUpload, IconShare, IconDelete, IconHistory } from './Icons'
import { formatDuration } from '../gameLogic'
import { saveSettings } from '../platform/storage'

export default function Modals() {
  const {
    showSettings, setShowSettings, settings, setSettings,
    theme, setTheme, voiceOn, toggleVoice,
    liveCode, liveViewers, startHosting, stopHosting,
    setShowJoinModal, showJoinModal, joinCode, setJoinCode, joinAsSpectator,
    handleExport, handleImport, importRef,
    syncData, setSyncData, handleSyncImport,
    detailGame, setDetailGame, shareGameResult, deleteGame, fmtDate,
    showPastTournaments, setShowPastTournaments, tournamentHistory, calcStandings,
    seasons, showSeasons, setShowSeasons, createSeasonAction, endSeasonAction, getSeasonStats,
    h2hPlayers, setH2hPlayers, getDetailedH2H, members, getQRCode
  } = useApp();

  return (
    <>
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
          <div className="setting-row setting-row-live">
            <div><div className="setting-label">Live Spectator</div><div className="setting-desc">P2P score sharing across devices</div></div>
          </div>
          <div className="live-controls">
            {liveCode ? (
              <div className="live-host-active">
                <div className="live-qr-card">
                  <div className="live-qr-frame">
                    <img src={getQRCode(`ttc-${liveCode}`)} alt="QR" className="live-qr"/>
                  </div>
                  <div className="live-code-row">
                    <span className="live-code-label">ROOM</span>
                    <span className="live-room-code">{liveCode}</span>
                  </div>
                </div>
                <div className="live-viewers-badge">{liveViewers} viewer{liveViewers!==1?'s':''} connected</div>
                <button className="btn btn-outline btn-sm" style={{width:'100%',justifyContent:'center'}} onClick={stopHosting}>Stop Hosting</button>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={startHosting}><IconLive/> Start Hosting</button>
            )}
            <button className="btn btn-outline btn-sm" style={{flex: liveCode ? 0 : 1}} onClick={() => { setShowSettings(false); setShowJoinModal(true); }}><IconLive/> Join Room</button>
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

      {/* GAME RESULT DETAIL MODAL */}
      <div className={`modal-overlay ${detailGame?'show':''}`} onClick={e => { if (e.target===e.currentTarget) setDetailGame(null); }}>
        {detailGame && (
          <div className="modal detail-modal">
            <div className="modal-handle"/>
            <div className="detail-winner">{detailGame.winner ? (detailGame.winner==='a'?detailGame.teamA:detailGame.teamB)+' Wins!' : 'In Progress'}</div>
            <div className="detail-score">
              <span className={detailGame.winner==='a'?'detail-w':''}>{detailGame.scoreA}</span>
              <span className="detail-sep">-</span>
              <span className={detailGame.winner==='b'?'detail-w':''}>{detailGame.scoreB}</span>
            </div>
            <div className="detail-teams">
              <span style={{color:'var(--a)',fontWeight:700}}>{detailGame.teamA}</span>
              <span style={{color:'var(--dim)'}}>vs</span>
              <span style={{color:'var(--b)',fontWeight:700}}>{detailGame.teamB}</span>
            </div>
            <div className="detail-info">
              {detailGame.targetScore} pts &bull; serve every {detailGame.serveInterval}
              {detailGame.deuceCount > 0 && <> &bull; {detailGame.deuceCount} deuce{detailGame.deuceCount>1?'s':''}</>}
              <br/>{fmtDate(detailGame.startedAt)}
              {detailGame.finishedAt && <> &bull; {formatDuration(detailGame.finishedAt - detailGame.startedAt)}</>}
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary" onClick={() => { shareGameResult(detailGame); }}><IconShare/> Share Result</button>
              <button className="btn btn-outline" onClick={() => { deleteGame(detailGame.id); setDetailGame(null); }}><IconDelete/> Delete</button>
            </div>
          </div>
        )}
      </div>

      {/* PAST TOURNAMENTS MODAL */}
      <div className={`modal-overlay ${showPastTournaments?'show':''}`} onClick={e => { if (e.target===e.currentTarget) setShowPastTournaments(false); }}>
        <div className="modal past-t-modal">
          <div className="modal-handle"/>
          <h3>Past Tournaments</h3>
          {tournamentHistory.length === 0 ? (
            <div className="teams-empty" style={{padding:'20px 0'}}>No completed tournaments yet</div>
          ) : tournamentHistory.map((t, ti) => {
            const st = calcStandings(t.pairs, t.matches);
            const champ = t.currentChampion ? t.pairs.find(p => p.id === t.currentChampion) : (st.length > 0 ? t.pairs.find(p => p.id === st[0]?.pairId) : null);
            return (
              <div key={t.id} className="past-t-card" style={{animationDelay:`${ti*.05}s`}}>
                <div className="past-t-header">
                  <span className="past-t-date">{fmtDate(t.createdAt)}</span>
                  <span className="past-t-format">{t.format === 'roundrobin' ? 'Round Robin' : 'King of Hill'}</span>
                </div>
                {champ && <div className="past-t-winner">&#x1F3C6; {champ.name}</div>}
                <div className="past-t-stats">{t.matches.length} matches &bull; {t.pairs.length} teams &bull; {t.targetScore} pts</div>
                {st.slice(0, 3).map((s, i) => (
                  <div key={s.pairId} className="past-t-standing">
                    <span className="past-t-rank">{i+1}.</span>
                    <span className="past-t-name">{s.name}</span>
                    <span className="past-t-wl">{s.won}W {s.lost}L</span>
                  </div>
                ))}
              </div>
            );
          })}
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:16,padding:14,fontSize:15}} onClick={() => setShowPastTournaments(false)}>Done</button>
        </div>
      </div>

      {/* JOIN ROOM MODAL */}
      <div className={`modal-overlay ${showJoinModal?'show':''}`} onClick={e => { if (e.target===e.currentTarget) setShowJoinModal(false); }}>
        <div className="modal">
          <div className="modal-handle"/>
          <h3>Join Live Room</h3>
          <div className="join-form">
            <input className="join-input" value={joinCode} onChange={e => setJoinCode(e.target.value.replace(/\D/g,'').slice(0,4))} onKeyDown={e=>{if(e.key==='Enter'){e.target.blur();joinAsSpectator();}}} placeholder="4-digit code" maxLength={4} inputMode="numeric"/>
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:14,fontSize:15,borderRadius:14}} onClick={joinAsSpectator} disabled={joinCode.length!==4}>Join Room</button>
          </div>
          <div className="join-hint">Enter the room code shown on the host device</div>
        </div>
      </div>
      {/* SEASONS MODAL */}
      <div className={`modal-overlay ${showSeasons?'show':''}`} onClick={e => { if (e.target===e.currentTarget) setShowSeasons(false); }}>
        <div className="modal past-t-modal">
          <div className="modal-handle"/>
          <h3>Seasons</h3>
          {seasons.length === 0 ? (
            <div className="teams-empty" style={{padding:'20px 0'}}>No seasons yet</div>
          ) : seasons.map(s => {
            const stats = getSeasonStats(s);
            return (
              <div key={s.id} className="past-t-card">
                <div className="past-t-header">
                  <span className="past-t-date">{s.name}</span>
                  <span className={`past-t-format ${s.endedAt?'':'badge-live'}`}>{s.endedAt ? 'Ended' : 'Active'}</span>
                </div>
                <div className="past-t-stats">{stats.tournaments} tournaments &bull; {stats.totalMatches} matches</div>
                {stats.playerStats.slice(0, 3).map((ps, i) => (
                  <div key={ps.id} className="past-t-standing">
                    <span className="past-t-rank">{i+1}.</span>
                    <span className="past-t-name">{ps.name}</span>
                    <span className="past-t-wl">{ps.won}W {ps.lost}L{ps.tournamentWins > 0 ? ` \u{1F3C6}${ps.tournamentWins}` : ''}</span>
                  </div>
                ))}
                {!s.endedAt && <button className="btn btn-outline btn-sm" style={{marginTop:8,width:'100%',justifyContent:'center'}} onClick={() => endSeasonAction(s.id)}>End Season</button>}
              </div>
            );
          })}
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:12,padding:14,fontSize:15}} onClick={() => {
            const name = prompt('Season name:');
            if (name?.trim()) createSeasonAction(name.trim());
          }}>Create New Season</button>
          <button className="btn btn-outline" style={{width:'100%',justifyContent:'center',marginTop:8,padding:14,fontSize:15}} onClick={() => setShowSeasons(false)}>Done</button>
        </div>
      </div>

      {/* H2H COMPARISON MODAL */}
      <div className={`modal-overlay ${h2hPlayers?'show':''}`} onClick={e => { if (e.target===e.currentTarget) setH2hPlayers(null); }}>
        {h2hPlayers && (() => {
          const mA = members.find(m => m.id === h2hPlayers.a);
          const mB = members.find(m => m.id === h2hPlayers.b);
          const data = getDetailedH2H(h2hPlayers.a, h2hPlayers.b);
          return (
            <div className="modal detail-modal">
              <div className="modal-handle"/>
              <div className="h2h-title">Head to Head</div>
              <div className="h2h-players">
                <span style={{color:'var(--a)',fontWeight:800}}>{mA?.name || '?'}</span>
                <span style={{color:'var(--dim)',fontSize:12}}>vs</span>
                <span style={{color:'var(--b)',fontWeight:800}}>{mB?.name || '?'}</span>
              </div>
              <div className="h2h-score">
                <span className={data.aWins >= data.bWins ? 'detail-w' : ''}>{data.aWins}</span>
                <span className="detail-sep">-</span>
                <span className={data.bWins >= data.aWins ? 'detail-w' : ''}>{data.bWins}</span>
              </div>
              <div className="detail-info">
                {data.total} matches &bull; Avg score: {data.avgPF}-{data.avgPA}
              </div>
              {data.matches.length > 0 && (
                <div className="h2h-matches">
                  {data.matches.slice(-5).reverse().map((m, i) => (
                    <div key={i} className="h2h-match-row">
                      <span className={m.aWon?'stat-w':'stat-l'}>{m.scoreA}</span>
                      <span style={{color:'var(--dim)'}}>-</span>
                      <span className={!m.aWon?'stat-w':'stat-l'}>{m.scoreB}</span>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:16,padding:14,fontSize:15}} onClick={() => setH2hPlayers(null)}>Done</button>
            </div>
          );
        })()}
      </div>
    </>
  );
}
