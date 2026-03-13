# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ReadLingo** — A client-side React app that generates English reading articles and paragraph-level TTS audio via Google Gemini API, designed for language learners at different proficiency levels.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Type-check only (tsc --noEmit), no test runner
npm run clean     # Remove dist/
```

**Environment:** Requires `.env` with `GEMINI_API_KEY` (see `.env.example`).

## Architecture

**Single-component design:** `src/App.tsx` is the entire application — one React component with all state, logic, and JSX. There are no pages, routes, or shared component files.

**AI services** (`src/services/gemini.ts`):
- `generateArticle(topic, difficulty)` → calls `gemini-3-flash-preview` for text
- `generateSpeech(text, difficulty)` → calls `gemini-2.5-flash-preview-tts`, returns WAV as Base64
- Raw PCM audio from Gemini is wrapped in a WAV header by `createWavFile()` if not already WAV

**Audio playback:** Uses Web `AudioContext` directly (not `<audio>` element) for iOS Safari compatibility. Audio state is managed via `useRef` (`audioCtxRef`, `sourceNodeRef`, `audioBufferRef`, `startOffsetRef`, `startCtxTimeRef`) to track pause/resume position.

**Persistence:** Pure `localStorage` — no backend. Two keys:
- `readlingo_state` → `{ topic, difficulty, article }` (current session)
- `readlingo_audio_cache` → `Record<paragraphText, wavBase64>` (per-paragraph audio cache)

Audio cache is cleared on each new article generation. State is restored on app load via inline IIFE in the component body.

**Unused dependencies:** `express`, `better-sqlite3`, and `dotenv` are in `package.json` but not used by the frontend — likely scaffolded for a future backend.

## Key Constraints

- `GEMINI_API_KEY` is exposed to the browser via Vite (`process.env` → replaced at build time). This is intentional for the current client-only deployment model.
- `localStorage` quota can be exceeded when caching audio Base64. All writes are wrapped in `try/catch` and silently skipped on quota errors.
- Audio `onended` fires on both natural end and manual `stop()`. A position check (`pos >= duration - 0.1`) distinguishes natural completion from manual stop.
