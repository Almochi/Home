English | [简体中文](./README.md)

<div align="center">

# Almochi's Homepage

**A personal landing page built on Material 3 Expressive design tokens**

Full-bleed wallpaper, dynamic HCT palettes, adaptive light/dark and motion preferences, and a fully self-built M3E component set.

![Vue](https://img.shields.io/badge/Vue-3.5-42B883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Material 3 Expressive](https://img.shields.io/badge/Material%203-Expressive-6750A4)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)

</div>

## What this is

A single page with no router and no backend — every bit of state lives in the browser. Three ideas hold it together:

- **Design tokens**: colors, shapes, type, motion, elevation, spacing and layering all live in `src/styles/tokens.css`; components never hard-code them.
- **One configuration home**: site identity, credentials, behaviour and appearance are typed constants in `src/config`. `import.meta.env` is rejected repo-wide.
- **Self-built atoms**: Button, IconButton, Chip, Switch, Slider, SegmentedButton, Progress, Loading, Tooltip, Surface, Divider and Icon — twelve of them, with no UI framework.

The only dependencies are `vue` and `@material/material-color-utilities`. Output is roughly 88 KB of gzipped JS (the color engine split into an 18 KB chunk) plus 9 KB of gzipped CSS.

## Features

- [x] Full-bleed wallpaper: a self-hosted illustration in four widths (`srcset`), a local gallery, Bing's daily image, random wallpapers and random anime art — with original-image download
- [x] Wallpaper showcase mode (hides every panel, `Esc` to exit)
- [x] Clock, date and live weather (city located from the visitor's IP; key-free source by default, Azure Maps optional; the row disappears when no source is usable)
- [x] A quote (click for another)
- [x] Site-link grid and social links
- [x] Time capsule (today / week / month / year progress) and site age
- [x] Music player: playlist, lyrics, seeking, volume, loop/shuffle, MediaSession keys
- [x] Dynamic color settings: light/dark, seed hue, nine palette styles, Material 2021/2025, motion preference
- [x] Offline-ready (PWA) with an update notice
- [x] Responsive: two columns on desktop, one on narrow screens, bottom sheets on mobile

## Implementation notes

### Tokens and color

- Thirty-five color roles are resolved at runtime from seed hue × palette style × spec version × light/dark and written to `--mc-*`. The stylesheet also ships oklch fallbacks driven by `--hue`, so the first paint never flashes even without JS.
- **Hue from the wallpaper**: the current image is downscaled to 24×24, converted to HCT per pixel, and reduced to a chroma-weighted dominant hue; canvas tainting or a too-grey image falls back to the configured hue.
- Every palette application is coalesced through `requestAnimationFrame`; dragging the hue slider never recomputes 35 roles per frame, and reduced-motion users get no light/dark cross-fade.

### Components, icons and naming

- Layers run `atoms → molecules → organisms → layout`; lower layers may not import higher ones, and components may not import `@/api` directly (data comes through composables).
- Icons are extracted from `@iconify-json` (Material Symbols, Rounded first, plus simple-icons) into an inline SVG registry by `scripts/generate-icons.mjs`: no runtime dependency, no network request, and a typo fails the lint step.
- File names, exports, CSS block names and i18n keys all point at each other — a composable lives in `src/composables` and matches its file name (`usePwa.ts` → `usePwa()`), a component's block is derived from its file name (`FooterBar.vue` → `.footer-bar`, M3-spec components use `m3-*`), and keys are lowercase and dot-separated. See [`NAMING.md`](./NAMING.md).

### Configuration, state and storage

- Site identity, credentials, behaviour and appearance live in `src/config`; `vite.config.ts` reads the same module to inject titles, descriptions and icons into `index.html` at build time.
- All `localStorage` access goes through `src/utils/storage.ts` using a `{ version, data }` envelope — anything that does not match falls back to defaults. Keys share the `home:` namespace: `home:prefs`, `home:theme`, `home:locale`. Runtime state (open panels, playback position) is never persisted.
- Restored preferences are validated field by field: wrong types, out-of-range numbers and hand-edited values all fall back to defaults.

### Weather and wallpapers

- Weather defaults to **AuroraAPI** (Microsoft weather data, no key, two-step protocol) with **Azure Maps** as an alternative; field mapping lives only in `src/api/weather.ts`. With no usable source the page issues **no request at all** and hides the row.
- The city follows the visitor: `autoLocate` (on by default) prefers an Amap Web-service key when configured, otherwise key-free Chinese providers. Only Chinese IPs with a city-level name are accepted; failures fall back to the configured city. Location is resolved once per page.
- Every wallpaper source returns an image directly — an `<img>` is not subject to CORS, so a static site needs no proxy. Failed remote sources fall back to the default illustration with a snackbar.
- Wallpapers are large and switched on demand, so they stay out of the PWA precache and are served by the runtime image cache instead.

### Player

- A hand-written state machine instead of a player library: lyrics, loop, shuffle, seeking, volume and MediaSession all stay controllable, and every style goes through tokens.
- The playlist endpoint is a **template with placeholders** (`:server` / `:type` / `:id` / `:auth` / `:r`), so switching instances is a one-line change. Parsing requires a name and a playable URL, deduplicates by id, and accepts durations in seconds or milliseconds.
- The playlist is never fetched on first paint: only opening the player, pressing play, or explicitly enabling autoplay triggers it.
- There is exactly one timer implementation: every periodic task subscribes to `useTicker`, which aligns to whole ticks, stops while the tab is hidden, and shares one timer per period.

### Accessibility and i18n

- Semantic landmarks, a single `h1`, a skip link, focus trap and focus restore for overlays, `focus-visible` outlines and state layers; `prefers-reduced-motion`, `prefers-reduced-transparency` and `prefers-contrast` are all honoured.
- Every string goes through the dictionary (Simplified Chinese / English). `src/i18n/locales/zh.ts` is the source of truth and derives `I18nKey`; `en.ts` is constrained by `Record<I18nKey, string>`, so a missing entry fails the build. Parameterised strings keep identical `{placeholder}` names.

### Tooling

- `pnpm typecheck` (vue-tsc, strict), `pnpm design:lint` (tokens, breakpoints, naming, dependency direction, atom inventory, icon names, i18n keys, configuration entry), `pnpm lint` (Biome) and `pnpm smoke` (Playwright, with screenshots).
- Vite 8 with the Rolldown bundler and the oxc minifier; the color engine is split into its own chunk and all styles are plain CSS.
- TypeScript follows the official dual-install scheme: `typescript` is aliased to `@typescript/typescript6` (the 6.x JS API line `vue-tsc` runs on), because TypeScript 7.0 exposes no programmatic API.

## Quick start

```bash
# Node.js >= 20.19, pnpm 11
pnpm install

pnpm dev          # http://localhost:3000
pnpm check        # typecheck + design lint + biome
pnpm build
pnpm preview      # then: pnpm smoke (writes screenshots/, not committed)
```

## Configuration

Configuration has a single home: `src/config` (see [`src/config/README.md`](./src/config/README.md)). There is no `.env`, and `import.meta.env` is rejected by `pnpm design:lint`.

| Path | Purpose |
| --- | --- |
| `src/config/site.ts` | Name, author, keywords, description, URL, language, icons, start date, ICP filing, repository URL |
| `src/config/profile.ts` | Avatar and the two greeting variants |
| `src/config/theme.ts` | Dynamic color defaults (seed hue, palette style, spec version, mode) |
| `src/config/weather.ts` | Source (`aurora` key-free / `azure` with your own key), city and index, refresh interval, auto-locate |
| `src/config/music.ts` | Meting API template and playlist parameters (an empty id disables the player entirely) |
| `src/config/wallpaper.ts` | Wallpaper sources and cache policy |
| `src/config/features.ts` | Feature flags — disabled means zero requests, zero DOM, zero bundle weight |
| `src/config/links/siteLinks.json` | Site links (`icon` is a local icon name, `img` accepts an image) |
| `src/config/links/socialLinks.json` | Social links (`tip` becomes a hover hint) |
| `src/config/breakpoints.ts` | The single source of breakpoints |
| `src/config/changelog.ts` | The changelog shown in Settings |

With `repo` empty in `site.ts`, every repository entry point (footer, settings, info panel, console signature) is hidden; fill it in and they all appear. Changing `site.ts` requires a rebuild — the title, description and icons are injected into `index.html` at build time and re-synced at runtime by `src/utils/documentHead.ts`.

## Docs

- [`DESIGN.md`](./DESIGN.md) — token definitions and visual rules
- [`docs/m3e-standard.md`](./docs/m3e-standard.md) — token tables, atom inventory, extension guide
- [`AGENTS.md`](./AGENTS.md) — hard rules for contributors and AI assistants
- [`NAMING.md`](./NAMING.md) — file, export, CSS block and i18n key naming

## Deployment

- **Static hosting / Vercel / Cloudflare Pages**: build with `pnpm build`, output `dist`. Site information comes from `src/config/site.ts`, so no platform-side environment variables are needed.
- **Docker**:

  ```bash
  docker build -t home .
  docker run -p 12445:12445 -d home
  ```

- **GitHub Actions**: pushes to `main` and pull requests run typecheck, design lint, Biome and the build, then upload `dist` (see `.github/workflows/build.yml`).

## Trade-offs

- **No CSS framework**: the page is small, and tokens plus scoped styles stay more controllable than two competing naming systems.
- **No state library**: there is one global state object, so `reactive` plus an explicit persistence contract is smaller and keeps runtime state out of `localStorage`.
- **No CSS preprocessor**: tokens already provide variables and reuse.
- **A hand-written player rather than APlayer**: full control over lyrics, looping, shuffle and MediaSession, with every style on tokens.
- **A grid rather than a carousel for site links**: any number of links fits, with one less runtime dependency and no gesture conflicts.
- **One timer implementation**: everything periodic subscribes to `useTicker`.
- **No custom cursor and no right-click blocking**: replacing the system cursor loses "where is my pointer" and system gesture hints, and the context menu is a browser feature — neither is offered as a switch.
- **Configuration instead of `.env`**: `VITE_*` is bundled in plain text anyway, so "secrets in environment variables" is an illusion. One typed, lint-checked home for configuration is honest about it.
- **Wallpapers stay out of the PWA precache**: they are large and switched on demand.
- **Screenshots are not committed**: `screenshots/` is generated by `pnpm smoke` and listed in `.gitignore`.

## Tribute

- **[imsyy](https://github.com/imsyy)**, the upstream author: the product shape and interaction model come from [imsyy/home](https://github.com/imsyy/home) — the full-bleed wallpaper, clock and weather, quote, site links, time capsule, player and settings panel all follow it. The upstream author has said the repository receives no new features; this rewrite is a tribute to it, keeping the shape while replacing the implementation. The upstream project is MIT-licensed; this project is an independent rewrite that contains none of its source and is released under AGPL-3.0.
- **[Shirone](https://github.com/LyraVoid/Shirone)**: the Material 3 Expressive token organisation and code conventions are modelled on it.
- **Icons**: [Material Symbols](https://fonts.google.com/icons) and [simple-icons](https://simpleicons.org/).
- **Color algorithms**: [material-color-utilities](https://github.com/material-foundation/material-color-utilities).

## License

[AGPL-3.0](./LICENSE) — an independent rewrite of [imsyy/home](https://github.com/imsyy/home) (MIT) that contains none of the upstream source.
