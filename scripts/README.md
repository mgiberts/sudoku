# Scripts

Small command map for generated Sudoku data.

## Expert Status

```bash
bun run status:expert
bun run validate:games
```

`status:expert` is read-only. It reports the current curated Expert total, real/mock split, final readiness, generator progress summary if `scripts/output/curatedExpert.progress.json` exists, and a cheap input-file summary if `scripts/input/curated-expert.txt` exists.

## Expert Import

Put externally prepared puzzles in `scripts/input/curated-expert.txt`, one 81-character puzzle per line. Use `0` or `.` for empty cells.

```bash
bun run import:expert:check
bun run import:expert
bun run validate:games:expert
```

Use `import:expert:check` first. It validates the 100-game input without writing generated source. Import errors include source line numbers. The import summary reports exact duplicate input rows as `duplicateInput` and duplicate normalized game IDs as `duplicateGame`.

For smaller real batches:

```bash
bun run import:expert:partial
bun run validate:games
```

Partial import merges existing real curated games and drops temporary mock games.

## Expert Generation

The JavaScript Expert generator is resumable. The recommended path uses the `remix` strategy, which starts from a unique puzzle, swaps clues through alternate-solution checks, and minimizes again until it reaches the Expert clue band.

```bash
bun run profile:expert
caffeinate -dimsu bun run generate:expert:probe
caffeinate -dimsu bun run generate:expert:range-probe
```

To generate the curated source file:

```bash
caffeinate -dimsu bun run generate:expert
```

The long run writes accepted games to `src/generated/curatedExpert.v1.ts` and progress to `scripts/output/curatedExpert.progress.json`.

## Starter Data

```bash
bun run generate:starters:smoke
bun run generate:starters
bun run validate:games
```

Starter generation writes 3 Easy, 3 Medium, 3 Hard, and 3 Master games.

## Smoke Checks

```bash
bun run import:expert:smoke
bun run generate:expert:smoke
bun run generate:starters:smoke
```

Smoke commands write only to `/tmp` or use dry-run mode.
