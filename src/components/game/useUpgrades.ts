"use client";

import { useCallback, useEffect, useState } from "react";
import {
  buyUpgrade,
  fetchUpgrades,
  isValidSolWallet,
  SCORES_EVENT,
  UPGRADES_EVENT,
  type UpgradeState,
} from "@/lib/api";
import { loadPlayer, loadPlayerKey } from "@/lib/player";
import type { UpgradeId } from "@/lib/upgrades";

/**
 * Shared upgrade-shop state: wallet pickup, balance/levels fetch, purchases.
 * Used by both the page shop and the in-canvas panel; both stay in sync via
 * SCORES_EVENT / UPGRADES_EVENT.
 */
export function useUpgrades() {
  const [wallet, setWallet] = useState("");
  const [state, setState] = useState<UpgradeState | null>(null);
  const [busy, setBusy] = useState<UpgradeId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (w: string) => {
    if (!isValidSolWallet(w)) {
      setState(null);
      return;
    }
    setState(await fetchUpgrades(w));
  }, []);

  // Pick up the saved wallet and re-sync after submits and purchases.
  useEffect(() => {
    let current = "";
    const sync = () => {
      const saved = loadPlayer().wallet;
      if (saved) current = saved;
      setWallet((prev) => prev || saved);
      void refresh(current || saved);
    };
    sync();
    window.addEventListener(SCORES_EVENT, sync);
    window.addEventListener(UPGRADES_EVENT, sync);
    return () => {
      window.removeEventListener(SCORES_EVENT, sync);
      window.removeEventListener(UPGRADES_EVENT, sync);
    };
  }, [refresh]);

  const buy = useCallback(
    async (id: UpgradeId) => {
      if (busy) return;
      setBusy(id);
      setError(null);
      const res = await buyUpgrade({ wallet, playerKey: loadPlayerKey(), upgrade: id });
      if (!res.ok) {
        setError(res.error);
        await refresh(wallet); // buyUpgrade only fires the event on success
      }
      setBusy(null);
    },
    [busy, wallet, refresh]
  );

  return { wallet, setWallet, state, busy, error, buy, refresh };
}
