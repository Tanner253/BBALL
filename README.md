# $BBALL — beachball.meme

> A beachball cannot be held underwater forever.

The official site, meme depot, and (soon) anonymous voting arena for the
$BBALL Solana memecoin community.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack, RSC)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/) — design tokens in
  [`src/app/globals.css`](src/app/globals.css)
- [Framer Motion](https://www.framer.com/motion/) — physics on the hero ball
- Static generation, deployable on Vercel with zero config

## Pages

- `/` — Landing with the interactive **Ocean Scene** (drag ball under, release
  for slingshot launch)
- `/game` — **Beachball Launch**: canvas launcher/skipping game with a global
  daily leaderboard. Top 3 every 24h cycle (00:00 UTC) earn 100k / 50k / 25k
  $BBALL, paid manually to the submitted Solana wallet
- `/memes` — **Meme Depot**: tabbed catalog of images + captions, one-click
  copy/download, search + tag filtering
- `/vote` — **Meme Arena** preview (coming soon, anonymous community voting)
- `/lore` — Long-form why-a-beachball

## Adding memes

Drop the file in `public/memes/`, then add an entry to
[`src/data/memes.ts`](src/data/memes.ts). It will automatically show up
in the depot and the homepage teaser.

## Local dev

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Deploy

This project is optimized for Vercel.

```bash
vercel             # preview
vercel --prod      # production
```

### Leaderboard API (Render + MongoDB)

The game's global leaderboard is served by `server/` (Express + MongoDB),
deployed to Render via the `render.yaml` blueprint at the repo root.

1. In Render: **New → Blueprint**, point it at this GitHub repo.
2. When prompted, paste your MongoDB connection string into `MONGODB_URI`.
3. In Vercel, set `NEXT_PUBLIC_API_URL` to the Render service URL
   (e.g. `https://bball-api.onrender.com`) for Production + Preview.

Environments:

- **Dev** — frontend defaults to `http://localhost:4000`; run the API with
  `npm run dev` inside `server/` (copy `server/.env.example` to `server/.env`).
- **Preview (QA)** — Vercel previews use `NEXT_PUBLIC_API_URL`; the API allows
  `*.vercel.app` origins.
- **Prod** — `bball.fun` → Render `bball-api` → MongoDB.

API endpoints: `POST /api/runs` (one-time run token), `POST /api/scores`
(validated, plausibility-checked submit), `GET /api/leaderboard` (current
cycle, best per wallet), `GET /api/winners` (past podiums for manual payouts).

## Roadmap

- [x] Beachball Launch game + global daily leaderboard with $BBALL payouts
- [ ] Anonymous meme submissions (proof-of-human, no wallet connect)
- [ ] Cycle-based voting + leaderboard
- [ ] $BBALL airdrop wiring for top creators
- [ ] OG/share image renderer per meme
- [ ] Mobile haptics on slingshot release
