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

Environments: the build is fully static and there are no runtime secrets
required for the current feature set. When the voting backend lands, expect
`DATABASE_URL` and similar env vars to be added to Vercel project settings
for **Development**, **Preview** (QA), and **Production**.

## Roadmap

- [ ] Anonymous meme submissions (proof-of-human, no wallet connect)
- [ ] Cycle-based voting + leaderboard
- [ ] $BBALL airdrop wiring for top creators
- [ ] OG/share image renderer per meme
- [ ] Mobile haptics on slingshot release
