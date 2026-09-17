# Scripts

Small command map for generated Sudoku data.

## Starter Data

```bash
bun run generate:starters:smoke
bun run generate:starters
bun run validate:games
```

Starter generation writes three games for each difficulty to `src/generated/starterPuzzles.ts`. The app keeps a three-board queue full with device-generated games for the active difficulty. Each generation request has a 15-second deadline.

The smoke command writes only to `/tmp`.
