# Software engineer portfolio

A Next.js portfolio powered by Supabase with a local JSON fallback.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Without Supabase credentials, the site reads `content/content.json`. The CV link, `profile.links.cv`, points to `public/Imane-Rissouni-CV.pdf`.

## Environment

`SITE_URL` is the public origin used by Open Graph metadata, the sitemap, and robots.txt. It defaults to `http://localhost:3000` for local runs. For deployment, set it to your public URL before building. See `.env.example`.

Run `npm run build` and then `npm run start` to serve the production build from `.next/`. The homepage is prerendered and becomes eligible for regeneration after five minutes.

## Scripts

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the development server.            |
| `npm run build`     | Build for production.                    |
| `npm run start`     | Serve the production build.              |
| `npm run lint`      | Run ESLint.                              |
| `npm run typecheck` | Check TypeScript types.                  |
| `npm test`          | Run the Vitest suite once.               |
| `npm run format`    | Format project files with Prettier.      |
| `npm run db:seed`   | Upsert the JSON content into Supabase.   |
| `npm run db:export` | Refresh the JSON fallback from Supabase. |

## Phase 2: Supabase

```text
Supabase (four tables) → map rows → validate full payload
    ↓ if a query, deadline, or validation fails, or expected content is missing
content/content.json → validate fallback
    ↓ either valid source
filter visible rows → sort lists → getContent() → homepage and metadata
```

Copy `.env.example` to `.env.local` for local use.

| Variable                    | Where it is used                                                     |
| --------------------------- | -------------------------------------------------------------------- |
| `SUPABASE_URL`              | Supabase project URL. Set locally and on Vercel for live reads.      |
| `SUPABASE_ANON_KEY`         | Public SELECT key used by the server. Set locally and on Vercel.     |
| `SUPABASE_SERVICE_ROLE_KEY` | Local seed and export scripts only. Never set it on Vercel.          |
| `REVALIDATE_SECRET`         | Shared secret between the deployment and Supabase Database Webhooks. |
| `SITE_URL`                  | Public portfolio origin for Open Graph, sitemap, and robots.         |

**Seed.** Run `npm run db:seed` with the project URL and service role key. The script validates JSON before writing. It upserts the profile at ID 1 and uses deterministic integer IDs in the reserved range 1,000,000,000–1,999,999,999 for list rows. IDs derive from project title, experience organization/role/start year, or skill category. Reordering and editing other fields preserve those IDs. Reserve this range for the script. Renaming an identity field creates a new row, and the script leaves existing and removed rows in place. Each table is written separately, so retry after fixing any reported error.

**Export.** Run `npm run db:export` with the same local credentials. The script includes hidden rows and replaces `content/content.json` only after validation. Review and commit the updated JSON to refresh the deployed fallback.

**Database Webhooks.** Create a Supabase Database Webhook for each of `profile`, `projects`, `experiences`, and `skills`. Select INSERT, UPDATE, and DELETE, use POST to `https://YOUR_SITE/api/revalidate`, and set the `x-revalidate-secret` header to the deployment's `REVALIDATE_SECRET`. Accepted requests mark the homepage for regeneration on its next visit. [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)

**Keep-alive.** Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in GitHub Actions repository secrets. The workflow queries the profile on a three-day day-of-month cron schedule and supports manual dispatch.

## Phase 3: AI assistant

The portfolio loads the dialog when a visitor opens it. The browser sends up to ten recent messages to `POST /api/chat`. The server validates the request, applies rate limits, reads public portfolio data through `getContent()`, and sends that data and the conversation to the configured provider. The route streams plain text back. The browser keeps the conversation in React state, and refreshing the page clears it.

Set these server-side variables in `.env.local` or in the Vercel project. To switch providers, change the three `LLM_*` values together.

| Variable                   | Purpose                                                               |
| -------------------------- | --------------------------------------------------------------------- |
| `LLM_BASE_URL`             | OpenAI-compatible API prefix. The server appends `/chat/completions`. |
| `LLM_API_KEY`              | Provider key.                                                         |
| `LLM_MODEL`                | Provider model identifier.                                            |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST URL for shared rate counters.                      |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token.                                             |
| `SITE_URL`                 | Public origin allowed to send browser chat requests in production.    |

Redis applies fixed windows of 8 requests per minute and 40 per day per IP, plus 300 per day across the site. When Redis is unavailable, each server instance enforces 5 per minute and 40 per day per IP, plus 300 per day for that instance. The provider request has a 20-second deadline. The portfolio works independently of the chat.

The system prompt limits answers to the portfolio, asks the assistant to identify itself as AI, and instructs it to decline unrelated or rule-changing requests. Replies use English or French. Other languages receive an English reply with a note. Public profile and portfolio fields supply the context. Phone numbers, secrets, and hidden portfolio entries are excluded. Visitors are told that their messages go to a third-party AI provider and that replies can contain mistakes.

## Roadmap

1. Phase 1 — Static portfolio (done)
2. Phase 2 — Supabase content (done)
3. Phase 3 — AI chatbot (done)
4. Phase 4 — Polish
