# TT Counter - Complete User Guide

## Overview

**TT Counter** is an offline-first Progressive Web App for scoring table tennis matches with tournament management, ELO ratings, achievements, and social sharing. No server required — works entirely in the browser.

---

## Screens

### 1. Setup Screen (Home)
- **Game Mode**: 11 pts or 21 pts
- **Serve Rotation**: Every 2 or Every 5
- **Team Names**: Customizable (max 12 chars), defaults to "Team A" / "Team B"
- **Start Game**: Begin a quick match
- **Teams**: Player management & tournament setup
- **History**: Past games

### 2. Teams Screen
- **Add Player**: Input + Enter or tap +
- **Player List**: Each player shows:
  - Availability checkbox (toggle on/off)
  - Name
  - ELO rating (starts at 1200)
  - Achievement badge count
  - Delete button
- **Tournament Settings** (4+ players):
  - Points (11/21), Serve interval (2/5)
  - Format: **King of the Hill** or **Round Robin**
  - **Balance by ELO** checkbox — pairs strongest with weakest
- **Player Stats**: Cumulative W/L across all tournaments
- **Generate Pairs & Play**: Requires 4+ players (KOTH) or 6+ (Round Robin)
- **Continue Tournament**: Resume an active tournament

### 3. Tournament Screen
- **Dopamine Winner Banner**: Trophy + winner name (when finished)
- **Champion Banner** (KOTH): Crown + defending champion pair
- **Standby Pick Card** (KOTH, odd players): Choose partner from losing team
- **Next Match Card** (KOTH): Champion vs next challenger with Play button
- **Round Robin Match List**: All matches with Play buttons on unfinished ones
- **Queue** (KOTH): Pairs waiting + standby player
- **Tabs**: Match History | Standings (table + bar chart)
- **Share**: Sync URL (active) or results image (finished)
- **Footer**: Discard / End & Crown (KOTH) / End Tournament (RR) / New Tournament

### 4. Game Screen
- **Scoreboard**: Two tappable halves (orange Team A / cyan Team B)
- **Serve Indicator**: Animated dot + "X left" on serving team
- **Deuce Banner**: Gold pulsing "DEUCE! (count)" at center
- **Streak Banner**: "X in a row!" when 3+ consecutive points
- **Bottom Bar**: Undo | Timer + deuce count + voice/live dots | History

### 5. Win Screen
- Crown animation + winner name in team color
- Large score display
- Stats: total points, deuces, duration, best streak
- **Momentum Chart**: SVG line showing score differential over time
- **Back to Tournament** (tournament match) or **New Game** (quick match)

### 6. History Screen
- Game cards: date, duration, scores, winner, deuce count
- In-progress games: "Continue from here" button
- Delete individual games
- Settings icon → opens Settings modal

### 7. Settings Modal
| Setting | Description | Default |
|---------|-------------|---------|
| Vibration | Haptic feedback on score | ON |
| Sound Effects | Beeps on score/deuce/win | ON |
| Dark Mode | Toggle dark/light theme | Dark |
| Voice Scoring | Say "up"/"down" to score | OFF |
| Live Broadcast | Share scores to other tabs | OFF |
| Export | Download all data as JSON | — |
| Import | Load JSON backup file | — |

---

## User Flows

### Quick Match
1. Setup → configure points/serve/names → Start Game
2. Tap team halves to score → auto-serves, deuce, win detection
3. Win screen → New Game or View History

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

### Sync Scores
1. Tournament screen → tap Share icon → sync URL generated
2. Share URL via messenger/email
3. Recipient opens URL → "Sync Tournament Scores?" modal
4. Tap Import & View → tournament loaded locally

### Share Results Image
1. Finished tournament → tap Share icon
2. PNG card generated: winner, standings, match scores
3. Native share sheet or download

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

## Input Methods

### Touch/Click
- Tap team half to score
- Tap Undo button to revert

### Keyboard
| Key | Action |
|-----|--------|
| Volume Up / Arrow Up | Point Team A |
| Volume Down / Arrow Down | Point Team B |
| Ctrl+Z / Cmd+Z | Undo |

### Voice Commands
Enable in Settings → Voice Scoring. Say:
| Command | Action |
|---------|--------|
| "up", "one", "left" | Point Team A |
| "down", "two", "right" | Point Team B |
| "undo", "back" | Undo last point |

Requires microphone permission. Green dot shows when active.

---

## ELO Rating System

- **Default**: 1200 for all players
- **Updates**: After each **tournament** match only (not quick matches)
- **K-factor**: 32
- **Balance pairs**: Toggle on Teams screen — snake-drafts strongest with weakest
- **Displayed**: Next to each player name on Teams screen

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

**Backup**: Export regularly via Settings. Clearing browser data deletes everything.

---

## PWA & iOS

- **Install**: Use browser's "Add to Home Screen"
- **Offline**: Fully functional without internet
- **iOS Safe Areas**: Notch and home indicator handled
- **Fullscreen**: Runs without browser chrome
- **Auto-update**: Service worker updates in background

---

## Tips

- **Quick match**: Just hit Start — defaults to Team A vs Team B, 21 pts
- **Tournament with odd players**: Standby rotation keeps everyone playing
- **Fair teams**: Enable "Balance by ELO" for skill-based pairing
- **Big screen**: Enable Live Broadcast, open app in second tab on projector
- **Hands-free**: Enable Voice Scoring while holding paddles
- **Light mode**: Toggle in Settings for outdoor/bright environments
- **Data safety**: Export backup before clearing browser data
