/**
 * Daily upgrade catalog — client mirror of server/src/lib.js UPGRADES
 * (server is the source of truth for costs; keep in sync). Upgrades are
 * bought with today's coins (daily balance — resets to 0 at 00:00 UTC),
 * last for the current UTC day, and reset for everyone at 00:00 UTC.
 */

import type { Mods } from "@/components/game/engine";

export type UpgradeId = "dunk" | "jetpack" | "power" | "radar" | "magnet" | "bounce";

export type UpgradeLevels = Record<UpgradeId, number>;

export const MAX_UPGRADE_LEVEL = 3;

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
    costs: [10, 30, 70],
  },
  {
    id: "jetpack",
    name: "Jetpack",
    emoji: "🚀",
    desc: "Afterburner kicks in right after launch, longer per level.",
    costs: [12, 35, 90],
  },
  {
    id: "power",
    name: "Super Boosts",
    emoji: "💥",
    desc: "Rings, jetstreams, dolphins & friends hit harder.",
    costs: [10, 30, 70],
  },
  {
    id: "radar",
    name: "Boost Radar",
    emoji: "📡",
    desc: "More boosts spawn along your flight path.",
    costs: [8, 20, 45],
  },
  {
    id: "magnet",
    name: "Coin Rain",
    emoji: "🪙",
    desc: "More coins spawn and you grab them from further away.",
    costs: [8, 20, 45],
  },
  {
    id: "bounce",
    name: "Bouncy Ball",
    emoji: "🦘",
    desc: "Regular skips and crash-downs keep way more speed.",
    costs: [10, 25, 60],
  },
];

export const ZERO_LEVELS: UpgradeLevels = {
  dunk: 0,
  jetpack: 0,
  power: 0,
  radar: 0,
  magnet: 0,
  bounce: 0,
};

/** Convert owned levels into the engine modifiers used by the sim. */
export function modsFrom(levels: UpgradeLevels): Mods {
  return {
    launchMul: 1 + 0.07 * levels.dunk,
    jetpackTime: 0.9 * levels.jetpack,
    boostMul: 1 + 0.15 * levels.power,
    boostRateMul: 1 + 0.35 * levels.radar,
    coinRateMul: 1 + 0.35 * levels.magnet,
    coinReach: 1.5 + 0.5 * levels.magnet,
    skipBounce: 0.08 * levels.bounce,
  };
}
