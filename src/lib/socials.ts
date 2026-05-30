/**
 * Centralized $BBALL community + token links.
 * Update once, propagates everywhere.
 */

/** The on-chain SPL token mint (used on pump.fun + as the public contract). */
export const tokenMint =
  "4AJiHGU2DTgD6NSGKTmQvqX92qawyTuVbfcskFBrpump";

/** The Dexscreener pair address used inside the chart embed URL. */
export const dexPair =
  "5RDLAJdW1e9on3Z82jgeqhreztsbUiN1QEqibYGsCsmY";

export const socials = {
  x: "https://x.com/bballonpf",
  telegram: "https://t.me/beachballsol",
  dexscreener: `https://dexscreener.com/solana/${dexPair}`,
  pumpfun: `https://pump.fun/coin/${tokenMint}`,
  devContact: "https://x.com/osknyo_dev",
} as const;
