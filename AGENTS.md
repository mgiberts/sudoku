# Repository Guidelines

## Project Structure & Module Organization

This is a Vite + React Sudoku app. Application code lives in `src/`.

- `src/App.tsx` contains the main UI, controls, settings panel, and dialogs.
- `src/gameState.tsx` owns reducer-based game state and local storage behavior.
- `src/sudoku.ts` contains puzzle generation and board validation logic.
- `src/types.ts` defines shared TypeScript types.
- Tests sit beside source files as `*.test.ts`, for example `src/sudoku.test.ts`.
- Global styling is in `src/styles.css`; production output is generated into `dist/`.

## Build, Test, and Development Commands

Use Bun for project scripts.

- `bun run dev` starts the local Vite development server.
- `bun run build` runs TypeScript compilation and creates a production build.
- `bun run typecheck` runs `tsc --noEmit`.
- `bun run test:fast` runs Vitest without coverage.
- `bun run test` runs the full Vitest test suite.
- `bun run lint` runs Biome linting.
- `bun run format:check` checks formatting and lint rules with Biome.
- `bun run pr:check` runs formatting, linting, typecheck, and tests.

## Coding Style & Naming Conventions

Write TypeScript and React using existing patterns in `src/`. Use tabs for indentation, matching the current Biome formatting. Prefer clear component and function names such as `SettingsPanel`, `createInitialGame`, and `isDigitComplete`.

Keep state transitions in `gameState.tsx`, puzzle rules in `sudoku.ts`, and UI-only logic in `App.tsx`. Use shared types from `src/types.ts` instead of repeating unions or object shapes.

## Testing Guidelines

Tests use Vitest. Place tests next to the module under test and name them `*.test.ts`. Keep tests focused on behavior: reducer transitions in `gameState.test.ts`, puzzle generation and validation in `sudoku.test.ts`.

Run `bun run test:fast` during development and `bun run pr:check` before submitting changes.

## Commit & Pull Request Guidelines

No Git history is available in this checkout, so use a simple imperative commit style, for example `Add settings backdrop` or `Refine dark theme colors`.

Pull requests should include a short summary, verification commands run, and screenshots or screen recordings for UI changes. Link related issues when applicable and call out any local storage or state migration behavior.

## Agent-Specific Instructions

Avoid unrelated refactors. Keep UI changes consistent with the compact game layout, and verify TypeScript, tests, and Biome before handing off.
