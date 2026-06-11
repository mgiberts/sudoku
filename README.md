# Sudoku

A compact Sudoku game built for quick play in the browser.

## Play

Open the live game at https://mgiberts.github.io/sudoku/

## Stack

- React
- TypeScript
- Biome
- Vite

## Roadmap

### 1. GitHub Pages site

- Published at https://mgiberts.github.io/sudoku/
- Uses a GitHub Actions workflow to build and deploy `dist/`.
- Uses Vite `base: "/sudoku/"` for repository Pages hosting.

### 2. Smarter puzzle generation

- Generate unique puzzles in the background with a Web Worker.
- Ship starter puzzles so new games feel instant.
- Use curated offline-generated Expert puzzles for the hardest mode.

### 3. Become an offline page

- Add a web app manifest with app name, theme color, and icons.
- Add a small service worker that caches the built HTML, CSS, JavaScript, and static assets.
- Show a stable fallback experience when the user opens the page without network access.
- Test installability and offline loading in Chrome DevTools.

## License

This project is licensed under the PolyForm Noncommercial License 1.0.0. You may use, copy, modify, and distribute the code for noncommercial purposes only. See [LICENSE](LICENSE) for details.
