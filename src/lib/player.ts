/** Persisted player identity (display name + SOL payout wallet), local only. */

const NAME_KEY = "bball:game:name";
const WALLET_KEY = "bball:game:wallet";
const KEY_KEY = "bball:game:key";

/**
 * Random per-device key. The first device to use a wallet soft-claims it on
 * the server, so only that device can spend the wallet's coins on upgrades.
 */
export function loadPlayerKey(): string {
  try {
    let key = window.localStorage.getItem(KEY_KEY);
    if (!key) {
      key = crypto.randomUUID();
      window.localStorage.setItem(KEY_KEY, key);
    }
    return key;
  } catch {
    return "";
  }
}

export function loadPlayer(): { name: string; wallet: string } {
  try {
    return {
      name: window.localStorage.getItem(NAME_KEY) ?? "",
      wallet: window.localStorage.getItem(WALLET_KEY) ?? "",
    };
  } catch {
    return { name: "", wallet: "" };
  }
}

export function savePlayer(name: string, wallet: string) {
  try {
    window.localStorage.setItem(NAME_KEY, name);
    window.localStorage.setItem(WALLET_KEY, wallet);
  } catch {
    // storage unavailable (privacy mode) — identity just won't persist
  }
}
