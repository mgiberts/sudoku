# Architecture

## Goals

- Keep the game fast to start and responsive during play.
- Keep Sudoku rules and generation separate from React UI.
- Make generated puzzle data reproducible and validated.

## Application structure

- `src/App.tsx` owns the main screen composition and dialogs.
- `src/SudokuContext.tsx` wires game state, settings, and puzzle selection.
- `src/gameState.tsx` owns reducer-based gameplay state.
- `src/sudoku.ts` owns Sudoku generation, solving, and validation rules.
- `src/storage.ts` owns local storage reads, writes, and migrations.

## Puzzle generation

- Starter puzzles are shipped with the app for instant first play.
- Non-Expert puzzles can be prefetched in a Web Worker.
- Expert puzzles are curated offline and bundled because they are expensive to generate reliably in the browser.

## Game data

- Generated puzzles are stored as compact strings using `0` for empty cells.
- Runtime game state uses board arrays because that is easier for gameplay logic.
- Game data is validated before being bundled.

## State and persistence

- Gameplay state is reducer-driven.
- Persistent data is isolated behind `storage.ts`.
- Storage migrations happen at the storage boundary.

## Major decisions

### Use a Web Worker for puzzle prefetching

Puzzle generation can be expensive enough to affect UI responsiveness. A worker keeps generation off the main thread and lets the app cache puzzles before the player needs them.

### Bundle curated Expert puzzles

Expert generation is slower and less predictable, so Expert uses offline-generated, validated puzzles instead of relying on browser-time generation.

### Keep Sudoku logic outside React

Rules, solving, validation, and generation live in plain TypeScript modules so they can be tested independently from the UI.
