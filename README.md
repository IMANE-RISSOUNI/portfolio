# Software engineer portfolio

A Next.js portfolio generated from `content/content.json`.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Edit `content/content.json` to update the portfolio. The CV link, `profile.links.cv`, points to `public/Imane-Rissouni-CV.pdf`.

## Environment

`SITE_URL` is the public origin used by Open Graph metadata, the sitemap, and robots.txt. It defaults to `http://localhost:3000` for local runs. For deployment, set it to your public URL before building. See `.env.example`.

Run `npm run build` and then `npm run start` to serve the production build from `.next/`. The homepage is prerendered and becomes eligible for regeneration after five minutes.

## Scripts

| Script              | Purpose                             |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Start the development server.       |
| `npm run build`     | Build for production.               |
| `npm run start`     | Serve the production build.         |
| `npm run lint`      | Run ESLint.                         |
| `npm run typecheck` | Check TypeScript types.             |
| `npm test`          | Run the Vitest suite once.          |
| `npm run format`    | Format project files with Prettier. |

## Roadmap

1. Phase 1 — Static portfolio (done)
2. Phase 2 — Supabase content
3. Phase 3 — AI chatbot
4. Phase 4 — Polish
