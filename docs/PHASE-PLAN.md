# TT Counter — Phase Plan

Based on your decisions. Priority order: Architecture > Polish > Competitive > Social.
Key constraint: **React Native migration planned** — all code must be platform-agnostic where possible.

---

## Phase 1: Architecture Refactor
**Goal:** Break monolithic App.jsx into testable, portable components. React Native-ready structure.

### 1.1 — Project Structure
```
src/
  components/
    SetupScreen.jsx
    GameScreen.jsx
    TeamsScreen.jsx
    TournamentScreen.jsx
    HistoryScreen.jsx
    WinScreen.jsx
    SpectatorOverlay.jsx
    modals/
      SettingsModal.jsx
      SyncModal.jsx
      JoinRoomModal.jsx
      GameDetailModal.jsx
      PastTournamentsModal.jsx
  hooks/
    useGameState.js        — scoring, undo, deuce, serve, streak, timer
    useTournament.js       — KOTH + RR state machine, standings
    useVoice.js            — SpeechRecognition (web-only, swappable for RN)
    useLive.js             — PeerJS host/spectator
    useStorage.js          — localStorage wrapper with quota handling
  contexts/
    AppContext.jsx          — settings, members, theme, navigation
  utils/
    gameLogic.js           — pure functions (no changes needed)
    tournament.js          — pure functions (no changes needed)
    elo.js                 — pure functions (no changes needed)
    achievements.js        — pure functions (no changes needed)
    share.js               — web-specific (swap for RN Share API later)
    spectator.js           — PeerJS wrapper (no changes needed)
    audio.js               — web-specific (swap for RN audio later)
    confetti.js            — web-specific (swap for RN Reanimated later)
    storage.js             — web-specific (swap for AsyncStorage later)
  App.jsx                  — ~100 lines: context providers + screen router
  index.css                — split later if needed, keep for now
```

### 1.2 — Unit Tests
- Install vitest
- Test gameLogic.js: serve calc, deuce detection, winner detection, deuce reset
- Test tournament.js: pair generation, KOTH flow, RR flow, standby pick, standings
- Test elo.js: rating updates, balanced pairing

### 1.3 — Data Reliability
- Storage quota detection with warning modal ("Storage almost full — keep last N days?")
- Maintain compressed player lifetime stats (total W/L/PF/PA) in `tt_player_records` — survives history deletion
- Validate sync/import data shape before applying (reject malformed)
- Schema versioning for localStorage data migration

---

## Phase 2: Bug Fixes & Polish
**Goal:** Smooth, crash-free experience. Every interaction feels right.

### 2.1 — Bug Fixes
- Voice recognition cleanup on screen change (no memory leaks)
- Voice commands updated to unique words: "score"/"point" (Team A), "switch"/"next" (Team B), "revert" (undo)
- iOS safe area consistency across ALL screens
- Keyboard auto-dismiss on Enter (all inputs except member add)

### 2.2 — UX Enhancements
- **Quick rematch button** on win screen (same teams, same settings, one tap)
- **Player avatars** — sleek color dot per player (auto-assigned from palette, shown on scoreboard + standings)
- **Streak vibration patterns** — 3-streak: short double pulse, 5-streak: triple pulse, 10-streak: long buzz
- **Landscape mode** — responsive layout for tablets (side-by-side scoring panels)

### 2.3 — ELO Form Indicator
- Calculate last 5 match trend per player
- Show arrow icon next to ELO on teams screen (green up / red down / gray neutral)

---

## Phase 3: Competitive Features
**Goal:** Deep tournament system that keeps players coming back.

### 3.1 — Knockout Bracket Format
- Single elimination bracket (seeded by ELO)
- Bye for odd-count pairs
- Visual bracket display
- Winner advances, loser eliminated
- Third option alongside KOTH and Round Robin

### 3.2 — Season System
- Create named seasons (e.g., "March 2026")
- Group tournaments into active season
- Cumulative season standings (aggregate W/L/ELO across tournaments)
- Season leaderboard with champion crowning
- Season history archive

### 3.3 — Player Comparison (H2H)
- Tap any two players to see head-to-head record
- Stats: matches played together vs against, win rate, avg score differential
- Visual comparison card (shareable)

---

## Phase 4: Social & Sharing
**Goal:** Make the app viral. Every result is shareable.

### 4.1 — QR Code for Spectator Join
- Host shows QR code alongside 4-digit room code
- Spectator scans with camera → auto-joins room
- Use `qrcode` library (lightweight, canvas-based)

### 4.2 — Tournament Invite Link
- Share link that encodes: member list + tournament settings
- Recipient opens → "Join tournament?" modal → auto-creates teams + tournament
- Extends existing sync URL system

### 4.3 — Weekly Digest
- Auto-generate summary image every 7 days (or on demand)
- Content: matches played, top ELO movers, tournament winners, streak records
- Canvas-rendered PNG, shareable via native share

---

## Phase 5: Future / React Native Prep
**Goal:** Everything ready for RN migration.

### 5.1 — Platform Abstraction Layer
- Create `platform/` folder with web implementations
- `platform/storage.js` → localStorage (web) / AsyncStorage (RN)
- `platform/audio.js` → Web Audio (web) / expo-av (RN)
- `platform/haptics.js` → navigator.vibrate (web) / expo-haptics (RN)
- `platform/share.js` → Web Share API (web) / RN Share (RN)

### 5.2 — Deferred Features
- Best-of-3/5 series (after season system is solid)
- Push notifications (after RN migration with expo-notifications)
- Cloud sync (after evaluating Supabase/Firebase for RN)

---

## Timeline Estimate

| Phase | Scope | Effort |
|-------|-------|--------|
| Phase 1 | Architecture + Tests + Data | 5-7 days |
| Phase 2 | Polish + Voice + Avatars + Landscape | 4-5 days |
| Phase 3 | Knockout + Seasons + H2H | 5-7 days |
| Phase 4 | QR + Invite + Digest | 3-4 days |
| Phase 5 | RN prep (abstraction layer) | 2-3 days |
| **Total** | | **19-26 days** |

---

## Rules for All Phases

1. **Zero feature regression** — every existing feature must work after each phase
2. **UI consistency** — keep the current dark theme, animations, and feel
3. **React Native aware** — no web-only APIs in business logic (isolate in platform layer)
4. **Build must pass** after every change
5. **No unnecessary dependencies** — keep bundle lean
