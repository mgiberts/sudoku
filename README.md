# Sudoku

A compact Sudoku game built for quick play in the browser.

## Stack

- React
- TypeScript
- Biome
- Vite

## Roadmap

### 1. Become a GitHub Pages site

- Set the correct Vite `base` path for the repository name.
- Add a GitHub Actions workflow that runs `bun install`, `bun run build`, and publishes `dist/`.
- Enable GitHub Pages for the repository and point it at the workflow deployment.
- Verify direct page loads and refreshes work from the deployed URL.

### 2. Become an offline page

- Add a web app manifest with app name, theme color, and icons.
- Add a small service worker that caches the built HTML, CSS, JavaScript, and static assets.
- Show a stable fallback experience when the user opens the page without network access.
- Test installability and offline loading in Chrome DevTools.

## License

This project is licensed under the PolyForm Noncommercial License 1.0.0. You may use, copy, modify, and distribute the code for noncommercial purposes only. See [LICENSE](LICENSE) for details.
