export type MemeCategory = "image" | "quote";

export type Meme = {
  slug: string;
  title: string;
  category: MemeCategory;
  /** Image source path under /public. */
  src: string;
  /** Optional copy-paste caption that goes with the image. */
  caption?: string;
  /** Tags for filtering. */
  tags: string[];
  /** width / height — used to lock the card to natural aspect, no cropping. */
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
  // ----- Visual / image memes ---------------------------------------------
  {
    slug: "you-are-here",
    title: "You are here",
    category: "image",
    src: "/memes/you-are-here.png",
    caption:
      "1. Damn, wish I bought.\n2. Haha I was right not to buy.\n3. Fuck.\n\nYou are here. $BBALL",
    tags: ["chart", "phases", "buyback", "classic"],
    aspect: 931 / 1006,
  },
  {
    slug: "what-happens-when-i-let-go",
    title: "What happens when I let go",
    category: "image",
    src: "/memes/what-happens-when-i-let-go.png",
    caption: "what happens when i let go twin. $BBALL",
    tags: ["jesus", "underwater", "classic"],
    aspect: 1,
  },
  {
    slug: "drake-slingshot",
    title: "Drake says: beachball underwater",
    category: "image",
    src: "/memes/slingshot.png",
    caption: "rockets? no.\nbeachball underwater? yes.\n\n$BBALL",
    tags: ["drake", "shitpost"],
    aspect: 1,
  },
  {
    slug: "beachball-irl",
    title: "Beachball, irl",
    category: "image",
    src: "/memes/eres.jpg",
    caption: "still floats. $BBALL",
    tags: ["irl", "underwater", "photo"],
    aspect: 1,
  },
  {
    slug: "made-it",
    title: "Made it.",
    category: "image",
    src: "/memes/made-it.png",
    caption: "told you. $BBALL",
    tags: ["mascot", "rich", "shitpost"],
    aspect: 1,
  },
  {
    slug: "beachball-lollipop",
    title: "Can't put it down",
    category: "image",
    src: "/memes/beachball-lollipop.png",
    caption: "Once you taste it you can't put it down. $BBALL",
    tags: ["lollipop", "sweet", "irl"],
    aspect: 1,
  },
  {
    slug: "the-market-is-a-beachball",
    title: "The market is a beachball underwater",
    category: "image",
    src: "/memes/bball-logo.png",
    caption: "the market is a beachball underwater. $BBALL",
    tags: ["banner", "thesis"],
    aspect: 600 / 200,
  },
  {
    slug: "community-wall",
    title: "The wall of cope",
    category: "image",
    src: "/memes/update.png",
    caption:
      "everyone's been saying it. now we minted it. $BBALL",
    tags: ["compilation", "receipts"],
    aspect: 1470 / 827,
  },

  // ----- Quote screenshots (real X posts) ---------------------------------
  {
    slug: "quote-mac",
    title: "Mac · @itzmac_",
    category: "quote",
    src: "/memes/11.png",
    caption: "crypto is a beachball underwater right now",
    tags: ["receipts", "twitter"],
    aspect: 584 / 92,
  },
  {
    slug: "quote-mirage",
    title: "mirage · @miragemunny",
    category: "quote",
    src: "/memes/33.png",
    caption: "beachball underwater",
    tags: ["receipts", "twitter"],
    aspect: 573 / 108,
  },
  {
    slug: "quote-alex",
    title: "alex · @alexxxx",
    category: "quote",
    src: "/memes/99.png",
    caption: "You can't hold a beachball underwater forever.",
    tags: ["receipts", "twitter", "thesis"],
    aspect: 413 / 68,
  },
  {
    slug: "quote-vibhu",
    title: "vibhu · @vibhu",
    category: "quote",
    src: "/memes/1010.png",
    caption: "Solana is an underwater beachball.",
    tags: ["receipts", "twitter", "solana"],
    aspect: 350 / 63,
  },
  {
    slug: "quote-poe",
    title: "POE · @poe_real69",
    category: "quote",
    src: "/memes/1111.png",
    caption: "I'm looking for a beachball underwater.\nDrop ca below",
    tags: ["receipts", "twitter"],
    aspect: 467 / 99,
  },
  {
    slug: "quote-chase",
    title: "chase · @chasexbtt",
    category: "quote",
    src: "/memes/chase.png",
    caption: "study bball underwater affect",
    tags: ["receipts", "twitter"],
    aspect: 485 / 79,
  },
  {
    slug: "quote-isellb4u",
    title: "ISELLB4U · @isellbeforeyou",
    category: "quote",
    src: "/memes/isb4.png",
    caption: "beachball underwater?",
    tags: ["receipts", "twitter"],
    aspect: 341 / 58,
  },
  {
    slug: "quote-nova",
    title: "Nova · @badattrading_",
    category: "quote",
    src: "/memes/nova.png",
    caption: "$SOBAT is a beach ball underwater",
    tags: ["receipts", "twitter"],
    aspect: 326 / 62,
  },
  {
    slug: "quote-seal",
    title: "seal · @fukupapers",
    category: "quote",
    src: "/memes/okkk.png",
    caption: "beach ball underwater.",
    tags: ["receipts", "twitter"],
    aspect: 239 / 91,
  },
  {
    slug: "quote-sol-incinerator",
    title: "Sol-Incinerator · @solincinerator",
    category: "quote",
    src: "/memes/sol.png",
    caption: "literally a beachball underwater",
    tags: ["receipts", "twitter", "solana"],
    aspect: 367 / 91,
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
  {
    slug: "market-is-a-beachball",
    text: "the market is a beachball underwater. $BBALL",
    tags: ["thesis", "one-liner"],
  },
  {
    slug: "what-happens-when-i-let-go",
    text: "what happens when I let go twin? $BBALL",
    tags: ["jesus", "shitpost"],
  },
  {
    slug: "drop-ca-below",
    text: "I'm looking for a beachball underwater. Drop ca below.",
    tags: ["raid", "one-liner"],
  },
];
