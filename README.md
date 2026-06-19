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
