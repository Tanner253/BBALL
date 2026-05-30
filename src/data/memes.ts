export type MemeCategory = "image" | "caption" | "shitpost";

export type Meme = {
  slug: string;
  title: string;
  category: MemeCategory;
  /** Image source path under /public, only for image memes. */
  src: string;
  /** Tweet/cast/copy-paste text optionally bundled with the image. */
  caption?: string;
  /** Tags for filtering. */
  tags: string[];
  /** Approximate aspect ratio so layout doesn't jank: width / height */
  aspect: number;
};

/**
 * The official meme depot.
 *
 * IMPORTANT: only real, community-supplied memes belong here.
 * Adding more is as simple as dropping a file into /public/memes
 * and appending an entry below.
 */
export const memes: Meme[] = [
  {
    slug: "you-are-here",
    title: "You are here",
    category: "image",
    src: "/memes/you-are-here.png",
    caption:
      "1. Damn, wish I bought.\n2. Haha I was right not to buy.\n3. Fuck.\n\nYou are here. $BBALL",
    tags: ["chart", "phases", "buyback", "classic"],
    aspect: 933 / 990,
  },
  {
    slug: "beachball-lollipop",
    title: "Can't put it down",
    category: "image",
    src: "/memes/beachball-lollipop.png",
    caption:
      "Once you taste it you can't put it down. $BBALL",
    tags: ["lollipop", "sweet", "irl"],
    aspect: 1,
  },
];

/**
 * Copy-only "captions" — pure text memes the community can paste anywhere.
 */
export const captions: { slug: string; text: string; tags: string[] }[] = [
  {
    slug: "underwater-forever",
    text: "a beachball cannot be held underwater forever. $BBALL",
    tags: ["thesis", "one-liner"],
  },
  {
    slug: "physics-with-branding",
    text: "$BBALL is just physics with branding.",
    tags: ["thesis", "one-liner"],
  },
  {
    slug: "ocean-stores-energy",
    text: "the ocean only stores energy. when it lets go, it launches. $BBALL",
    tags: ["thesis"],
  },
  {
    slug: "you-are-here-3",
    text: "1. Damn, wish I bought.\n2. Haha I was right not to buy.\n3. Fuck.\n\nYou are here.",
    tags: ["chart", "phases"],
  },
  {
    slug: "buoyancy-not-leverage",
    text: "We don't use leverage. We use buoyancy. $BBALL",
    tags: ["one-liner", "shitpost"],
  },
  {
    slug: "summer-coin",
    text: "summer is undefeated. $BBALL is just summer with a ticker.",
    tags: ["seasonal"],
  },
];
