# Curated Expert Input

Put `curated-expert.txt` here when importing externally prepared Expert puzzles.

Format:

- One puzzle per line.
- 81 characters per puzzle.
- Use `0` or `.` for empty cells.
- Lines starting with `#` are ignored.
- Import errors include source line numbers.
- The import summary reports duplicate input lines as `duplicateInput`.
- The import summary reports duplicate normalized game IDs as `duplicateGame`.

Then run:

```bash
bun run import:expert:check
bun run import:expert
```

For smaller batches that should merge into the current curated list:

```bash
bun run import:expert:partial
```

Quick importer check:

```bash
bun run import:expert:smoke
```
