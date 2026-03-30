# TT Counter - Complete User Guide

## Overview

**TT Counter** is an offline-first Progressive Web App for scoring table tennis matches with tournament management, ELO ratings, achievements, P2P live spectating, and social sharing. No server required — works entirely in the browser.

---

## Screens

### 1. Setup Screen (Home)
- **Game Mode**: 11 pts or 21 pts
- **Serve Rotation**: Every 2 or Every 5
- **Team Names**: Customizable (max 12 chars), always defaults to "Team A" / "Team B"
- **Start Game**: Begin a quick match
- **Settings**: Gear icon (top right) — vibration, sound, theme, voice, live, export/import
- **Teams**: Player management & tournament setup
- **History**: Past games

### 2. Teams Screen
- **Add Player**: Input + Enter or tap + (keyboard stays open for rapid adds)
- **Player List**: Each player shows:
  - Availability checkbox (toggle on/off, locked during active tournament)
  - Color avatar dot (auto-assigned)
  - Name
  - ELO rating with trend arrow (green up / red down / none)
  - Achievement badge count
  - Delete button (locked during active tournament)
- **Tournament Settings** (4+ players):
  - Points (11/21), Serve interval (2/5)
  - Format: **King of the Hill** | **Round Robin** | **Knockout**
  - **Balance by ELO** checkbox — snake-drafts strongest with weakest
- **Player Stats**: Cumulative W/L across all tournaments. Tap two players to see H2H comparison.
- **Footer Links**: Tournaments | Invite | Digest | Seasons
- **Generate Pairs & Play**: Requires 4+ players (KOTH/Knockout) or 6+ (Round Robin)
- **Continue Tournament**: Resume an active tournament

### 3. Tournament Screen
- **Dopamine Winner Banner**: Trophy + winner name (when finished)
- **Champion Banner** (KOTH): Crown + defending champion pair
- **Standby Pick Card** (KOTH, odd players): Choose partner from losing team
- **Next Match Card** (KOTH): Champion vs next challenger with Play button
- **Round Robin Match List**: All matches with Play buttons on unfinished ones
- **Knockout Bracket**: Rounds displayed with match cards, bye indicator, auto-advances
- **Queue** (KOTH): Pairs waiting + standby player
- **Tabs**: Match History | Standings (table + bar chart)
- **Share**: Sync URL (active) or results image (finished)
- **Footer**: Discard / End & Crown (KOTH) / End Tournament (RR/Knockout) / New Tournament

### 4. Game Screen
- **Scoreboard**: Two tappable halves (orange Team A / cyan Team B)
- **Serve Indicator**: Animated dot + "X left" on serving team
- **Deuce Banner**: Gold pulsing "DEUCE! (count)" at center
- **Streak Banner**: "X in a row!" when 3+ consecutive points (with milestone haptics at 3, 5, 10)
- **Bottom Bar**: Undo | Stop (red, with confirm) | Timer + deuce + voice/live indicators | History
- **Landscape**: Side-by-side panels on tablets

### 5. Win Screen
- Crown animation + winner name in team color
- Large score display
- Stats: total points, deuces, duration, best streak
- **Momentum Chart**: SVG line showing score differential over time
- **Quick Rematch**: Same teams, same settings, one tap
- **Back to Tournament** (tournament match) or **New Game** (quick match)

### 6. History Screen
- Game cards: date, duration, scores, winner, deuce count
- **Tap a finished game** → result detail modal with Share and Delete
- In-progress games: "Continue from here" button
- Settings icon → opens Settings modal

### 7. Settings Modal
| Setting | Description | Default |
|---------|-------------|---------|
| Vibration | Haptic feedback on score | ON |
| Sound Effects | Beeps on score/deuce/win | ON |
| Dark Mode | Toggle dark/light theme | Dark |
| Voice Scoring | Say "score"/"switch"/"revert" | OFF |
| Live Spectator | P2P room hosting + QR code | OFF |
| Export | Download all data as JSON | — |
| Import | Load JSON backup file | — |

---

## User Flows

### Quick Match
1. Setup → configure points/serve/names → Start Game
2. Tap team halves to score → auto-serves, deuce, win detection
3. Win screen → New Game, Quick Rematch, or View History

### King of the Hill Tournament
1. Teams → add 4+ players → toggle availability
2. Select KOTH format → configure points/serve → Generate Pairs & Play
3. First 2 pairs play, rest queue up
4. Winner stays as champion, next pair challenges
5. **Odd players**: standby picks one from losing team after each match
6. Repeat until queue empty → "End & Crown" → Dopamine Winner

### Round Robin Tournament
1. Teams → add 6+ players → select Round Robin format → Generate
2. All pair-vs-pair matches generated upfront
3. Play matches in any order (tap Play on each)
4. Standings update live → "End Tournament" when ready
5. Highest-ranked pair = Dopamine Winner

### Knockout Bracket Tournament
1. Teams → add 4+ players → select Knockout format → Generate
2. Bracket seeded from pairs (bye for odd count)
3. Play each round's matches → winners auto-advance to next round
4. Final match winner = Dopamine Winner

### Live Spectating (P2P)
1. Settings → Live Spectator → **Start Hosting**
2. Room code + QR code displayed
3. Share code/QR with spectators
4. Spectators: Settings → **Join Room** → enter 4-digit code or scan QR
5. Full-screen live scoreboard appears on spectator device
6. Works across devices on any network (uses WebRTC via PeerJS)

### Sync Scores
1. Tournament screen → tap Share icon → sync URL generated
2. Share URL via messenger/email
3. Recipient opens URL → "Sync Tournament Scores?" modal
4. Tap Import & View → tournament loaded locally

### Tournament Invite Link
1. Teams screen → tap **Invite** button
2. Link generated with members + tournament settings encoded
3. Recipient opens link → app auto-loads teams + settings → ready to play

### Share Results Image
1. Finished tournament → tap Share icon
2. PNG card generated: winner, standings, match scores
3. Native share sheet or download

### Weekly Digest
1. Teams screen → tap **Digest** button
2. PNG card generated: top 5 players, last week's matches
3. Share via native share or download

### Seasons
1. Teams screen → tap **Seasons** button
2. Create named seasons (e.g., "March 2026")
3. Tournaments played during active season are tracked
4. Season stats: tournament count, match count, player leaderboard
5. End season to archive → start new one

### Player H2H Comparison
1. Teams screen → Player Stats section
2. Tap first player (highlights with orange border)
3. Tap second player → H2H modal opens
4. Shows: win-loss record, average scores, last 5 match results

### Export / Import
1. Settings → Export → downloads `tt-counter-backup.json`
2. On new device: Settings → Import → select JSON file → all data restored

---

## Scoring Rules

### Win Condition
- Reach target score (11 or 21) **with 2+ point lead**
- Example: 21-19 = win, 21-20 = play continues

### Deuce Mechanic
When both teams reach target-1 with equal scores:
- **21-pt game**: 20-20 → DEUCE → scores reset to **15-15**
- **11-pt game**: 10-10 → DEUCE → scores reset to **7-7**
- If deuce happens again at 20-20, resets to 15-15 again (counter increments)
- Deuce count tracked and displayed throughout

### Serve Rotation
- Normal: rotates every N points (2 or 5)
- Near deuce (both at target-1): rotates **every point**
- Indicator shows serving team + serves remaining

---

## Tournament Formats

### King of the Hill (KOTH)
- Champion defends title against queue of challengers
- Winner stays, loser is out (or standby picks from loser for odd players)
- Best for 4-8 players, continuous play

### Round Robin
- Every pair plays every other pair exactly once
- Play matches in any order
- Winner = highest W/L record
- Best for 6-12 players, fair competition

### Knockout Bracket
- Single elimination, seeded from pairs
- Bye for odd pair count (auto-advances)
- Winners advance round by round
- Final match determines champion
- Best for 4-16 players, quick decisive tournaments

---

## Input Methods

### Touch/Click
- Tap team half to score
- Tap Undo button to revert
- Tap Stop button to leave match (with confirm dialog)

### Keyboard
| Key | Action |
|-----|--------|
| Volume Up / Arrow Up | Point Team A |
| Volume Down / Arrow Down | Point Team B |
| Ctrl+Z / Cmd+Z | Undo |
| Enter | Dismiss keyboard (team name inputs) |

### Voice Commands
Enable in Settings → Voice Scoring. Say:
| Command | Action |
|---------|--------|
| "score", "point", "first" | Point Team A |
| "switch", "second", "next" | Point Team B |
| "revert", "cancel", "back" | Undo last point |

Requires microphone permission. Green dot shows when active.

---

## ELO Rating System

- **Default**: 1200 for all players
- **Updates**: After each **tournament** match only (not quick matches)
- **K-factor**: 32
- **Balance pairs**: Toggle on Teams screen — snake-drafts strongest with weakest
- **Form indicator**: Green arrow (trending up), red arrow (trending down) based on last 5 matches
- **Displayed**: Next to each player name with color avatar on Teams screen

---

## Achievements

| Badge | Name | Requirement |
|-------|------|-------------|
| ⚔️ | First Blood | Win your first match |
| 🏆 | Dopamine Rush | Win a tournament |
| 🎯 | Deuce Master | 5+ deuces in one match |
| 🔥 | On Fire | 5-point scoring streak |
| 👑 | Comeback King | Win after trailing by 10+ |
| 🧹 | Clean Sweep | Win a shutout (opponent at 0) |
| ⭐ | Veteran | Play 50 matches |
| 💎 | Undefeated | 5 tournament wins in a row |

Badge count shown on player cards in Teams screen.

---

## Haptic Feedback

| Event | Pattern |
|-------|---------|
| Point scored | 15ms pulse |
| Deuce | 30ms pulse |
| Win | 50-50-50-50-100ms pattern |
| Undo | 8ms tap |
| 3-point streak | Double pulse (20-40-20ms) |
| 5-point streak | Triple pulse (20-30-20-30-20ms) |
| 10-point streak | Long buzz (30-20-30-20-30-20-60ms) |

---

## Data Storage

All data is stored locally in the browser (no cloud):

| Key | Content |
|-----|---------|
| `tt_history` | All games |
| `tt_settings` | Preferences |
| `tt_members` | Player roster |
| `tt_active_tournament` | Current tournament |
| `tt_tournament_history` | Completed tournaments |
| `tt_elo` | Player ratings |
| `tt_theme` | dark / light |
| `tt_badges` | Unlocked achievements |
| `tt_player_records` | Lifetime W/L per player (survives history deletion) |
| `tt_seasons` | Season definitions |

**Storage safety**: Auto-trims oldest entries if localStorage quota is exceeded. Player lifetime records are preserved even when history is deleted.

**Backup**: Export regularly via Settings. Clearing browser data deletes everything.

---

## Architecture

```
src/
  App.jsx                  35 lines — thin router
  context/AppContext.jsx    — all state + callbacks (the brain)
  components/              — screen components (UI only)
    SetupScreen, GameScreen, TeamsScreen,
    TournamentScreen, WinScreen, HistoryScreen,
    Modals, SpectatorOverlay, Icons
  hooks/                   — reusable logic
    useVoice.js, useLive.js
  platform/                — swappable for React Native
    storage.js, haptics.js
  utils                    — pure logic
    gameLogic.js, tournament.js, elo.js,
    achievements.js, seasons.js, share.js,
    spectator.js, audio.js, confetti.js, qr.js
  __tests__/               — 32 unit tests (vitest)
```

**React Native ready**: Business logic in hooks/utils is portable. Platform-specific APIs (storage, haptics, audio) isolated in `platform/` folder for easy swapping.

---

## PWA & iOS

- **Install**: Use browser's "Add to Home Screen"
- **Offline**: Fully functional without internet (except live spectating initial connection)
- **iOS Safe Areas**: Notch and home indicator padding on all screens
- **Fullscreen**: Runs without browser chrome
- **Auto-update**: Service worker updates in background
- **Landscape**: Responsive layout on tablets (side-by-side scoring)

---

## Tips

- **Quick match**: Just hit Start — defaults to Team A vs Team B, 21 pts
- **Quick rematch**: Tap "Quick Rematch" on win screen — same teams, one tap
- **Stop mid-match**: Red stop button in game bar (asks for confirmation)
- **Tournament with odd players**: Standby rotation keeps everyone playing
- **Fair teams**: Enable "Balance by ELO" for skill-based pairing
- **Big screen**: Start Hosting in settings, scan QR from spectator device
- **Hands-free**: Enable Voice Scoring — say "score" or "switch" while playing
- **Compare players**: Tap two players in stats list to see H2H record
- **Track seasons**: Use Seasons to group tournaments and track cumulative standings
- **Invite friends**: Share invite link to pre-load teams on their device
- **Weekly update**: Tap Digest for a shareable summary image
- **Light mode**: Toggle in Settings for outdoor/bright environments
- **Data safety**: Export backup before clearing browser data
- **Landscape**: Rotate tablet for side-by-side scoreboard
