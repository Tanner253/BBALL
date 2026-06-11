/**
 * Daily upgrade catalog — client mirror of server/src/lib.js UPGRADES
 * (server is the source of truth for costs; keep in sync). Upgrades are
 * bought with today's coins (daily balance — resets to 0 at 00:00 UTC),
 * last for the current UTC day, and reset for everyone at 00:00 UTC.
 */

import type { Mods } from "@/components/game/engine";

export type UpgradeId =
  | "dunk"
  | "jetpack"
  | "power"
  | "radar"
  | "magnet"
  | "bounce"
  | "aero"
  | "greed";

export type UpgradeLevels = Record<UpgradeId, number>;

export const MAX_UPGRADE_LEVEL = 5;

export const UPGRADE_LIST: {
  id: UpgradeId;
  name: string;
  emoji: string;
  desc: string;
  costs: number[];
}[] = [
  {
    id: "dunk",
    name: "Deeper Dunk",
    emoji: "🌊",
    desc: "The water lets you dunk deeper — stronger initial launches.",
    costs: [10, 40, 130, 400, 1100],
  },
  {
    id: "jetpack",
    name: "Jetpack",
    emoji: "🚀",
    desc: "Afterburner kicks in right after launch, longer per level.",
    costs: [12, 50, 160, 500, 1400],
  },
  {
    id: "power",
    name: "Super Boosts",
    emoji: "💥",
    desc: "Rings, jetstreams, dolphins & friends hit harder.",
    costs: [10, 40, 130, 400, 1100],
  },
  {
    id: "radar",
    name: "Boost Radar",
    emoji: "📡",
    desc: "More boosts spawn along your flight path.",
    costs: [8, 30, 100, 320, 900],
  },
  {
    id: "magnet",
    name: "Coin Rain",
    emoji: "🪙",
    desc: "More coins spawn and you grab them from further away.",
    costs: [8, 30, 100, 320, 900],
  },
  {
    id: "bounce",
    name: "Bouncy Ball",
    emoji: "🦘",
    desc: "Regular skips and crash-downs keep way more speed.",
    costs: [10, 40, 120, 380, 1000],
  },
  {
    id: "aero",
    name: "Slipstream",
    emoji: "💨",
    desc: "Slicker ball cuts through the air — way less drag per level.",
    costs: [15, 60, 200, 600, 1600],
  },
  {
    id: "greed",
    name: "Golden Touch",
    emoji: "✨",
    desc: "Every coin (and satellite) pays out bonus coins per level.",
    costs: [20, 80, 260, 800, 2000],
  },
];

export const ZERO_LEVELS: UpgradeLevels = {
  dunk: 0,
  jetpack: 0,
  power: 0,
  radar: 0,
  magnet: 0,
  bounce: 0,
  aero: 0,
  greed: 0,
};

/** Convert owned levels into the engine modifiers used by the sim. */
export function modsFrom(levels: UpgradeLevels): Mods {
  return {
    launchMul: 1 + 0.07 * (levels.dunk ?? 0),
    jetpackTime: 0.9 * (levels.jetpack ?? 0),
    boostMul: 1 + 0.15 * (levels.power ?? 0),
    boostRateMul: 1 + 0.35 * (levels.radar ?? 0),
    coinRateMul: 1 + 0.35 * (levels.magnet ?? 0),
    coinReach: 1.5 + 0.5 * (levels.magnet ?? 0),
    skipBounce: 0.08 * (levels.bounce ?? 0),
    dragMul: 1 - 0.09 * (levels.aero ?? 0),
    coinBonus: levels.greed ?? 0,
  };
}
