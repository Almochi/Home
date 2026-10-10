[Back to README](../README_EN.md) | 简体中文: [Index.md](./Index.md)

# Almochi's Homepage · Docs

Full-bleed wallpaper, dynamic HCT palettes and a fully self-built Material 3 Expressive component set — no UI framework, no backend. The only dependencies are `vue` and `@material/material-color-utilities`.

## Features

- [x] Full-bleed wallpaper: a self-hosted illustration in four widths (`srcset`), a local gallery, Bing's daily image, random wallpapers and anime art — with original-image download
- [x] Clock, date and live weather (city located from the visitor's IP; key-free source by default, Azure Maps optional)
- [x] Quote, site-link grid, social links, time capsule and site age
- [x] Music player: playlist, lyrics, seeking, volume, loop/shuffle, MediaSession keys
- [x] Dynamic color: light/dark, seed hue, nine palette styles, Material 2021/2025, motion preference
- [x] Wallpaper showcase mode, offline-ready (PWA), Chinese/English; reduced motion, reduced transparency and increased contrast all honoured
- [x] Responsive: two columns on desktop, one on narrow screens, bottom sheets on mobile

## Quick start

```bash
# Node.js >= 20.19, pnpm 11
pnpm install
pnpm dev        # http://localhost:3000
pnpm check      # typecheck + design token lint + Biome
pnpm build
pnpm preview    # preview the build; run pnpm smoke separately
```

## Configuration

Configuration has a single home: `src/config` — site identity, profile, theme, weather, music, wallpaper, feature flags and breakpoints. See [`src/config/README.md`](../src/config/README.md).

- Name, author, URL, icons, start date, ICP filing and repository URL: `site.ts` (an empty `repo` hides every repository entry point)
- Weather source and city, playlist URL and id, wallpaper sources, feature flags: `weather.ts` / `music.ts` / `wallpaper.ts` / `features.ts`
- Site and social links: `links/*.json` (`icon` takes a local icon name; register new icons and run `pnpm icons`)

Changing `site.ts` requires a rebuild — the title, description and icons are injected into `index.html` at build time.

## Deployment

- **Static hosting / Vercel / Cloudflare Pages**: build with `pnpm build`, output `dist`
- **Docker**: `docker build -t home . && docker run -p 12445:12445 -d home`
- Pushes to `main` and pull requests run typecheck, design lint, Biome and the build (`.github/workflows/build.yml`)

## Docs

- [`DESIGN.md`](../DESIGN.md): token definitions and visual rules
- [`docs/m3e-standard.md`](./m3e-standard.md): token tables, atom inventory, extension guide
- [`NAMING.md`](../NAMING.md): naming rules for files, exports, CSS blocks and i18n keys
- [`AGENTS.md`](../AGENTS.md): hard rules for contributors and AI assistants

## Tribute

The product shape and interaction model come from [imsyy/home](https://github.com/imsyy/home) — wallpaper, clock and weather, quote, site links, time capsule, player and settings all follow it, with the implementation rewritten from scratch. Token organisation and code conventions are modelled on [Shirone](https://github.com/LyraVoid/Shirone); icons come from [Material Symbols](https://fonts.google.com/icons) and [simple-icons](https://simpleicons.org/); colour algorithms come from [material-color-utilities](https://github.com/material-foundation/material-color-utilities).

## License

[AGPL-3.0](../LICENSE) — an independent rewrite of [imsyy/home](https://github.com/imsyy/home) (MIT) that contains none of the upstream source.
