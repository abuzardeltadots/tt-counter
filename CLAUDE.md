# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TT Counter is a table tennis scoring PWA built with Vite + React 18. It runs fully offline with service worker caching (via vite-plugin-pwa) and uses localStorage for persistence. No backend, no routing library, no state management library — all state lives in a single `App` component.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (outputs to `dist/`)
- `npm run preview` — serve the production build locally

There is no linter, formatter, or test runner configured.

## Architecture

**Single-component app**: `src/App.jsx` contains all UI, screens (setup → game → win → history), and orchestrates game state via `useState`/`useRef`. Screen transitions use CSS transform classes (`hidden`, `hidden-left`).

**Module responsibilities**:
- `src/gameLogic.js` — pure functions: serve calculation, deuce detection, winner detection, duration formatting. Win requires reaching `targetScore` with a 2-point lead.
- `src/storage.js` — thin localStorage wrapper (`tt_history`, `tt_settings` keys)
- `src/audio.js` — Web Audio API tone generation (score, deuce, win, undo sounds) + vibration
- `src/confetti.js` — canvas particle animation on win
- `src/index.css` — all styles in one file; CSS custom properties on `:root` for theming

**Key design patterns**:
- `stateRef` pattern: a ref that mirrors current state so event handlers/callbacks always read fresh values without re-registering
- Volume keys (AudioVolumeUp/Down) and arrow keys mapped to scoring during game screen
- Undo stack capped at 100 entries, stored in a ref (not persisted across sessions)
- Games auto-save to localStorage on every point change; unfinished games can be resumed from history

**PWA config** is in `vite.config.js` — manifest, icons, workbox caching. Display mode is `fullscreen` with portrait orientation lock.
