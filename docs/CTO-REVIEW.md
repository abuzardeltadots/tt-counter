# CTO Technical Review — TT Counter
**Date:** 2026-03-27
**App Version:** 1.0.0
**Stack:** React 18 + Vite 5 + PeerJS + vite-plugin-pwa

---

## Executive Summary

TT Counter is a polished offline-first PWA for table tennis scoring with tournament management, ELO ratings, achievements, P2P spectating, and voice commands — all running with zero backend. The UX is strong, the feature set is ambitious, and PWA quality is excellent.

The primary technical debt is a **monolithic 1,100+ line App.jsx** that houses all state, logic, and UI. This works today but will become the bottleneck for maintainability, testing, and performance as usage scales.

---

## Scorecard

| Category | Grade | Notes |
|----------|-------|-------|
| PWA Quality | **A-** | Offline-first, workbox caching, fullscreen, iOS meta tags |
| UX Design | **A** | Cohesive dark theme, smooth transitions, haptic/audio feedback |
| Feature Depth | **A** | PeerJS spectating, ELO, KOTH + RR tournaments, voice, achievements |
| Architecture | **D+** | Single 1,100-line component, 80+ state variables, untestable |
| Performance | **C** | Re-render risk at scale, no virtualization, standings O(n x m) |
| Data Integrity | **D** | No validation on import/sync, no localStorage overflow handling |
| Security | **D** | Sync URLs carry raw unvalidated JSON, no schema enforcement |
| Accessibility | **D+** | No ARIA roles, small touch targets, no focus management |
| Mobile Polish | **C+** | Some iOS safe area gaps, keyboard dismiss missing |
| Scalability | **C-** | Breaks at 100+ members, 50+ tournaments, 1000+ history |

---

## Architecture

### Current Structure

```
src/
  App.jsx          1,100+ lines — ALL screens, state, logic, UI
  gameLogic.js     35 lines — pure scoring functions
  tournament.js    190 lines — KOTH + RR creation, standings
  storage.js       28 lines — localStorage wrapper
  audio.js         29 lines — Web Audio API tones
  confetti.js      27 lines — canvas particle animation
  elo.js           48 lines — ELO ratings + balanced pairing
  achievements.js  45 lines — badge definitions + unlock logic
  share.js         120 lines — sync URLs + screenshot rendering
  spectator.js     60 lines — PeerJS host/client wrapper
  index.css        390+ lines — all styles in one file
```

### Problem

App.jsx manages: game state, tournament state machine, player management, voice recognition, P2P spectating, data import/export, achievement tracking, theme toggling, timer, streaks, modals, and all screen rendering — in a single component with ~80 useState calls and ~50 useCallback/useMemo hooks.

### Recommended Decomposition

```
src/
  components/
    GameScreen.jsx        — scoring UI, timer, streak, bottom bar
    TournamentScreen.jsx  — KOTH + RR views, standings, charts
    TeamsScreen.jsx        — member management, ELO display, settings
    SetupScreen.jsx        — quick match config
    HistoryScreen.jsx      — game list, detail modal
    SpectatorOverlay.jsx   — live score display for viewers
  hooks/
    useGameState.js        — scoring, undo, deuce, serve logic
    useTournament.js       — tournament state machine
    useVoice.js            — SpeechRecognition wrapper
    useLive.js             — PeerJS host/spectator
    useLocalStorage.js     — typed wrapper with quota handling
  contexts/
    AppContext.jsx          — shared state (settings, members, theme)
  App.jsx                  — screen router + context providers (~100 lines)
```

**Effort:** ~3-4 days for a senior developer. Zero feature changes — pure refactor.

---

## Performance Risks

### 1. Re-render Cascade on Every Point

Each `addPoint()` call triggers 5+ state setters:
```
setScoreA → setScoreB → setServing → setStreak → autoSave(setHistory) → setActiveTournament
```

React batches these in event handlers, but `autoSave` writes to localStorage synchronously and `calcStandings` (O(pairs x matches)) re-runs via useMemo on every `activeTournament` change.

**At scale (50 pairs, 500 matches):** ~1.25M iterations per point scored.

**Fix:** Debounce autoSave, memoize pair lookups with Map, extract standings to worker.

### 2. No Virtual Scrolling

History screen renders ALL game cards in DOM. At 500+ games:
- Initial render: ~200ms
- Scroll: janky reflows
- Memory: ~50MB DOM nodes

**Fix:** Use `react-window` or intersection observer for lazy rendering.

### 3. Voice Recognition Memory Leak

`SpeechRecognition.onend` restarts itself via closure reference. If component unmounts during speech, the recognition instance keeps running with stale refs.

**Fix:** Cleanup in useEffect return, null-check recognitionRef before restart.

---

## Data Integrity Gaps

### 1. No Validation on Import/Sync

```javascript
// Current: raw JSON goes straight into state
if (syncData.t) { setActiveTournament(syncData.t); }
```

A malformed tournament object (missing `pairs`, corrupt `matches`) crashes the app on next render.

**Fix:** Add schema validation (Zod or manual shape check) before applying imported data.

### 2. localStorage Overflow

`saveHistory()` calls `localStorage.setItem()` with no size check. At ~5MB limit:
- `QuotaExceededError` thrown
- App silently stops saving
- User loses data without warning

**Fix:**
```javascript
function safeSave(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch (e) {
    if (e.name === 'QuotaExceededError') {
      // Trim oldest entries and retry
      const trimmed = Array.isArray(data) ? data.slice(0, -50) : data;
      localStorage.setItem(key, JSON.stringify(trimmed));
    }
  }
}
```

### 3. No Data Migration

When app schema changes (e.g., adding `format` field to tournaments), old localStorage data missing new fields causes `undefined` access errors.

**Fix:** Version the data schema, migrate on load.

---

## Security

### Sync URL Risk

Sync URLs carry base64-encoded tournament + member data. If shared via unencrypted channel:
- Data is trivially decodable
- Crafted payloads could inject corrupt data
- No signature verification

**Mitigations:**
1. Validate imported data shape before applying
2. Sanitize player names: `name.replace(/<[^>]*>/g, '')`
3. Add HMAC signature for tamper detection (optional)

### ID Generation

```javascript
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
```

Low entropy — two rapid calls can collide. Use `crypto.randomUUID()` where available.

---

## Accessibility (WCAG 2.1 AA)

### Missing

| Element | Issue | Fix |
|---------|-------|-----|
| Game tap panels | No `role="button"`, no `aria-label` | Add ARIA attributes |
| Modals | No focus trap, Escape doesn't close | Add focus-trap, keydown handler |
| Member checkboxes | 28x28px (below 44px minimum) | Increase to 44x44px |
| Score updates | No screen reader announcement | Add `aria-live="polite"` region |
| Color contrast | `.vol-hint` at opacity 0.35 = 2.1:1 ratio | Increase to 0.5+ |
| Keyboard navigation | No tab order on game screen | Add tabIndex + onKeyDown |

---

## Mobile UX

### iOS Issues

1. **Safe area bottom** — Bottom bar gets clipped on iPhone 15+ (Dynamic Island). The `env(safe-area-inset-bottom)` is applied but inconsistently across all screens.

2. **Keyboard dismiss** — Text inputs don't dismiss keyboard on Enter. Users must tap outside.
   ```jsx
   onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
   ```

3. **Pull-to-refresh** — History list scroll triggers native iOS refresh. Fixed with `overscroll-behavior: contain` (recently applied).

4. **Wake lock unsupported** — `navigator.wakeLock` doesn't exist on iOS Safari. Screen dims during long matches.

### General

5. **No haptic differentiation** — Same 15ms vibration for regular point and streak milestones. Different patterns would add feedback richness.

6. **No landscape support** — Orientation locked to portrait. Large tablets would benefit from landscape layout.

---

## Enhancement Roadmap

### Tier 1 — Reliability (Week 1-2)

| Enhancement | Effort | Impact |
|------------|--------|--------|
| Schema validation on all storage loads | 4h | Prevents crashes from corrupt data |
| localStorage quota handling with auto-trim | 2h | Prevents silent data loss |
| Validate sync/import data before applying | 3h | Prevents crash from shared links |
| Keyboard dismiss on Enter for all inputs | 1h | Basic mobile UX |
| Cleanup voice recognition on screen change | 1h | Fixes memory leak |

### Tier 2 — UX Polish (Week 3-4)

| Enhancement | Effort | Impact |
|------------|--------|--------|
| Quick rematch button on win screen | 30m | Fastest path to next game |
| Swipe-to-delete on history cards | 3h | More natural mobile interaction |
| Player avatars (color/emoji picker) | 4h | Visual identity in standings |
| Different haptic patterns for streaks (3, 5, 10) | 1h | Richer feedback |
| Match recap animation on win screen | 4h | Engagement after match |
| Pull-down to start new game from setup | 2h | Gesture-based UX |

### Tier 3 — Social & Engagement (Week 5-6)

| Enhancement | Effort | Impact |
|------------|--------|--------|
| QR code for spectator room join | 3h | No typing 4-digit code |
| Tournament invite link (pre-creates teams) | 4h | One-tap tournament join |
| Weekly digest image (auto-generated summary) | 6h | Shareable engagement |
| Leaderboard embed widget (HTML snippet) | 4h | Office TV display |
| Push notification for tournament match ready | 3h | Multi-device awareness |

### Tier 4 — Competitive Features (Week 7-8)

| Enhancement | Effort | Impact |
|------------|--------|--------|
| Season system (group tournaments, cumulative standings) | 8h | Long-term engagement |
| Handicap mode (+points for weaker ELO) | 3h | Fairer casual play |
| Best-of-3/5 series with series score | 6h | Competitive depth |
| Player comparison page (H2H stats, avg score) | 4h | Rivalry tracking |
| Form indicator (recent trend arrow next to ELO) | 2h | Quick skill read |
| Knockout bracket tournament format | 8h | Third format option |

### Tier 5 — Architecture (Week 9-12)

| Enhancement | Effort | Impact |
|------------|--------|--------|
| Extract App.jsx into 6 components | 3d | Maintainability, testability |
| Custom useLocalStorage hook with compression | 1d | Data resilience |
| Virtual scrolling for history (react-window) | 4h | Performance at scale |
| Lazy-load PeerJS + confetti (dynamic import) | 2h | Bundle size -90KB |
| Add Zod schema validation for all persisted data | 4h | Type safety |
| Unit tests for gameLogic + tournament | 1d | Regression prevention |
| E2E tests with Playwright | 2d | Full flow coverage |

---

## Bundle Analysis

| Chunk | Size (gzip) | Notes |
|-------|-------------|-------|
| React + ReactDOM | ~52KB | Fixed cost |
| PeerJS | ~28KB | Only needed for live mode |
| App code | ~6KB | Scoring, tournament, UI |
| CSS | ~6KB | All styles |
| **Total** | **~86KB** | Good for a PWA |

**Optimization opportunities:**
- Lazy-load PeerJS: `const { createHost } = await import('./spectator')` — saves 28KB on initial load
- Lazy-load confetti: rarely used, 1KB savings
- Tree-shake achievements/elo if not used

---

## Conclusion

TT Counter is a **feature-complete MVP** with excellent UX and ambitious functionality for a zero-backend PWA. The immediate priorities are:

1. **Data resilience** — validation + quota handling (prevents user-facing crashes)
2. **Component extraction** — break App.jsx into focused pieces (enables everything else)
3. **Mobile polish** — iOS safe areas, keyboard handling, touch targets

The app is production-usable today for groups of 4-20 players with occasional tournaments. To support 50+ players, regular tournaments, and sustained daily use, the architecture refactor in Tier 5 becomes essential.

**Estimated timeline to production-grade:** 8-12 weeks with 1 senior developer.
