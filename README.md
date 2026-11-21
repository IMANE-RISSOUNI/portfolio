# Software engineer portfolio

A static Next.js portfolio generated from `content/content.json`. The included profile, work history, projects, links, and CV are fictional examples.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Edit `content/content.json` to update the portfolio. Replace the sample CV in `public/` and update `profile.links.cv` to point to your file.

Before publishing, copy `.env.example` to `.env.local` and set `SITE_URL` to the site's public origin for the sitemap and Open Graph metadata. The build downloads fonts from Google Fonts and writes the static site to `out/`.

## Scripts

- `npm run dev` starts the development server.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs strict TypeScript checks.
- `npm run format` formats project files with Prettier.
- `npm run build` builds the static export.

## Roadmap

1. Phase 1 — Static portfolio (this phase)
2. Phase 2 — Supabase content
3. Phase 3 — AI chatbot
4. Phase 4 — Polish
