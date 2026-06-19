# Factorio Library

A Vercel-friendly Next.js foundation for a public Factorio blueprint string library.

## Stack

- Next.js App Router
- Tailwind CSS v4
- Clerk authentication
- Neon Postgres database storage
- Vercel-ready deployment defaults

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add Clerk keys and `DATABASE_URL` from Neon to `.env.local` before testing authentication and uploads. In Vercel, add the same variables in Project Settings → Environment Variables (or connect the Neon integration).

## Current scope

Implemented:

- Factorio-themed layout converted from `theme.html`
- Landing, browse, upload, about, sign-in, sign-up, and reserved blueprint detail routes
- Clerk provider, auth controls, and proxy middleware
- Blueprint, report, like, view, and copy storage in Neon Postgres
- Empty states instead of placeholder blueprint data

Not implemented yet:

- Full blueprint parsing beyond string validation
- Advanced browse/search backend
- Versioning
- Moderation workflow

## Blueprint viewer integration

This project vendors the `packages/editor/src` source from [`teoxoy/factorio-blueprint-editor`](https://github.com/teoxoy/factorio-blueprint-editor) under `src/vendor/fbe-editor` and serves the exported Factorio data at `public/data/data.json`.

The app-facing integration is isolated to:

- `src/components/blueprints/BlueprintViewer.tsx`
- `src/lib/blueprints/viewer.ts`

`BlueprintViewer` is viewer-only: it renders a canvas in a dark panel and disables pointer events on the canvas. It does not expose editing controls, image upload, or image storage.

### Local Factorio sprite assets

Do not fetch or import Factorio sprites from GitHub or third-party mirrors. Real Factorio sprites are proprietary and must not be committed or redistributed in this repo.

For local development, generate sprites from your own Factorio install:

```bash
npm run sprites:local -- "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Factorio"
```

Requirements:

- A local Factorio install containing `data/base`, `data/core`, and any DLC/mod folders referenced by `public/data/data.json`.
- The `basisu` encoder on your `PATH`, or pass `--basisu <path>` / set `BASISU_BIN`.

The script:

- reads required PNG sprite references from `public/data/data.json`
- converts those local PNG files to `.basis`
- writes them under `public/data/__base__/`, `public/data/__core__/`, etc.
- writes `public/data/factorio-sprites-manifest.json`

Generated sprite folders are ignored by Git. If the manifest/assets are missing, the app shows a helpful notice and uses the schematic preview fallback rather than crashing.

Limitations:

- The preview currently runs client-side only.
- The upstream editor fetches `/data/data.json`, so that asset must remain available in `public/data/`.
- Modded, corrupted, train, or otherwise unsupported blueprint strings may fail validation and show the friendly preview error state.
- `factorio-blueprint-editor` is MIT licensed. Keep its license/attribution in mind if the vendored source is redistributed or materially modified.
