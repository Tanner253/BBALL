/**
 * Chat moderation — applied server-side so every client sees the same
 * sanitized text no matter what the sender's client claims.
 *
 * Filters, in order:
 *   1. links/domains            -> [link removed]
 *   2. contract addresses (CAs) -> [CA removed]   (base58 runs, 32-44 chars)
 *   3. tickers other than $BBALL-> [$*** removed] ($ prefix is the signal)
 *   4. basic profanity          -> starred out
 */

const PROFANITY = [
  "fuck", "shit", "bitch", "cunt", "asshole", "dick", "pussy", "whore",
  "slut", "nigger", "nigga", "faggot", "retard", "cock", "bastard",
  "douchebag", "dipshit", "motherfucker",
];
const PROFANITY_RE = new RegExp(`\\b(?:${PROFANITY.join("|")})[a-z]*\\b`, "gi");

const LINK_RE =
  /(https?:\/\/\S+|www\.\S+|\b[\w-]+\.(?:com|net|org|io|gg|xyz|fun|app|co|me|finance|cash|money|site|club|live|link|lol|wtf|to|sh|ai|us|tv)(?:\/\S*)?\b)/gi;

/** Solana-style base58 runs — catches CAs and raw wallet drops. */
const CA_RE = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

const TICKER_RE = /\$([A-Za-z][A-Za-z0-9_]{0,14})\b/g;

export function sanitizeChat(raw) {
  let text = String(raw ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
  if (!text) return "";
  text = text.replace(LINK_RE, "[link removed]");
  text = text.replace(CA_RE, "[CA removed]");
  text = text.replace(TICKER_RE, (m, sym) =>
    sym.toUpperCase() === "BBALL" ? "$BBALL" : "[$\u2731\u2731\u2731]"
  );
  text = text.replace(PROFANITY_RE, (m) => m[0] + "*".repeat(m.length - 1));
  return text.trim();
}

export function cleanName(raw) {
  return String(raw ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 18);
}

const SOL_WALLET_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isSignedIn(name, wallet) {
  return cleanName(name).length > 0 && SOL_WALLET_RE.test(String(wallet ?? ""));
}
