# Factorio Library

A Vercel-friendly Next.js foundation for a public Factorio blueprint string library.

## Stack

- Next.js App Router
- Tailwind CSS v4
- Clerk authentication
- Vercel-ready deployment defaults

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add Clerk keys to `.env.local` before testing authentication.

## Current scope

Implemented:

- Factorio-themed layout converted from `theme.html`
- Landing, browse, upload, about, sign-in, sign-up, and reserved blueprint detail routes
- Clerk provider, auth controls, and proxy middleware
- Empty states instead of placeholder blueprint data

Not implemented yet:

- Blueprint upload parsing/storage
- Browse index and search backend
- Versioning
- Moderation workflow

## Blueprint viewer integration

This project vendors the `packages/editor/src` source from [`teoxoy/factorio-blueprint-editor`](https://github.com/teoxoy/factorio-blueprint-editor) under `src/vendor/fbe-editor` and serves the exported Factorio data at `public/data/data.json`.

The app-facing integration is isolated to:

- `src/components/blueprints/BlueprintViewer.tsx`
- `src/lib/blueprints/viewer.ts`

`BlueprintViewer` is viewer-only: it renders a canvas in a dark panel, loads the editor code dynamically on the client, disables the upstream action registry, and disables pointer events on the canvas. It does not expose editing controls, image upload, or image storage.

Limitations:

- The preview currently runs client-side only because the upstream renderer depends on browser APIs, WebAssembly, and PixiJS.
- The upstream editor fetches `/data/data.json`, so that asset must remain available in `public/data/`.
- Modded, corrupted, train, or otherwise unsupported blueprint strings may fail validation and show the friendly preview error state.
- `factorio-blueprint-editor` is MIT licensed. Keep its license/attribution in mind if the vendored source is redistributed or materially modified.
