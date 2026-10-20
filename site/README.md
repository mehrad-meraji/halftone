# Halftone docs

The documentation site, built with [Astro Starlight](https://starlight.astro.build). It needs Node 22.12 or newer.

```bash
cd site
npm install
npm run dev      # http://localhost:4321
npm run build    # static files in site/dist
```

- **Component pages are generated.** `npm run gen` (run by `dev` and `build`) regenerates `custom-elements.json` and writes one page per component into `src/content/docs/components/`. The API tables come from the JSDoc, and the live examples come from the stories files. Do not edit those pages.
- **To hand-write a component page**, put an `.mdx` file in `overrides/<folder>.mdx` with the line `@@API@@` where the API tables go. See `overrides/select.mdx`.
- **Live components.** The site loads Halftone from `../src`, so examples always show the current source. The "Examples" blocks on generated pages are the deployed Storybook; set `PUBLIC_STORYBOOK_URL` to point them at a local one (`http://localhost:6006/`).
- **Theme.** `src/styles/theme.css` points Starlight's variables at the `--ht-*` tokens, so light and dark follow `tokens.css`.
- **Sub-folder.** Set `BASE_PATH` (for example `/halftone/`) when the site is served from one.
