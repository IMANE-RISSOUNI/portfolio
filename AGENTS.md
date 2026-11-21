<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portfolio

Build a static software engineer portfolio from editable local content.

- Stack: Next.js App Router, strict TypeScript, Tailwind CSS, CSS design tokens, Zod, ESLint, Prettier, and npm.
- `content/` holds the editable JSON. `src/lib/` holds schemas and the content loader.
- `src/app/` holds the page, layout, styles, and SEO files. `src/components/` holds typed portfolio sections. `public/` holds downloadable assets.
- All content comes through `getContent()` in `src/lib/content.ts`.
- Never commit secrets. Keep `.env*` files gitignored except `.env.example`.
