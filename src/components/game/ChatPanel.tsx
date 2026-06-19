"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { isValidSolWallet, SCORES_EVENT } from "@/lib/api";
import { loadPlayer, savePlayer } from "@/lib/player";
import {
  clearChatError,
  connectLive,
  getChatError,
  getChatLog,
  sendChat,
  subscribeChat,
} from "./live";

/**
 * Global beach chat under the game. Read-only for everyone; sending requires
 * being "signed in" (name + Solana wallet saved — same identity used for
 * leaderboard submits). All moderation happens server-side: profanity is
 * starred out, links and contract addresses are stripped, and the only
 * ticker allowed through is $BBALL.
 */
export function ChatPanel() {
  const messages = useSyncExternalStore(subscribeChat, getChatLog, getChatLog);
  const chatError = useSyncExternalStore(subscribeChat, getChatError, getChatError);

  const [player, setPlayer] = useState({ name: "", wallet: "" });
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const signedIn = player.name.trim().length > 0 && isValidSolWallet(player.wallet.trim());

  // Keep the socket alive and pick up identity saved by the submit panel.
  useEffect(() => {
    connectLive();
    const sync = () => setPlayer(loadPlayer());
    sync();
    window.addEventListener(SCORES_EVENT, sync);
    return () => window.removeEventListener(SCORES_EVENT, sync);
  }, []);

  // Jump to the newest message when history first loads, then stick to the
  // bottom as messages arrive (unless the reader scrolled up).
  const loadedRef = useRef(false);
  useEffect(() => {
    const el = listRef.current;
    if (!el || messages.length === 0) return;
    const firstLoad = !loadedRef.current;
    loadedRef.current = true;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (firstLoad || nearBottom) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text || !signedIn) return;
    if (sendChat(player.name.trim(), player.wallet.trim(), text)) {
      setDraft("");
      clearChatError();
    }
  };

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-display text-xl sm:text-2xl font-bold text-[var(--ink)]">
          Beach Chat
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-mute)]">
          $BBALL talk only · links &amp; CAs auto-removed
        </span>
      </div>

      <div
        ref={listRef}
        className="mt-4 h-[260px] overflow-y-auto overscroll-contain rounded-2xl bg-white/40 border border-white/60 p-3 flex flex-col gap-1.5"
      >
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-[var(--ink-mute)] text-center">
            Nothing yet — say gm to the beach. 🏖
          </p>
        ) : (
          messages.map((m) => (
            <p key={m.id} className="text-sm leading-snug break-words">
              <span className="font-bold text-[var(--ink)]">{m.name}</span>{" "}
              <span className="font-mono text-[9px] text-[var(--ink-mute)]">
                {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>{" "}
              <span className="text-[var(--ink-soft)]">{m.text}</span>
            </p>
          ))
        )}
      </div>

      {chatError && (
        <p className="mt-2 text-xs font-medium text-[var(--ball-red)]">{chatError}</p>
      )}

      {signedIn ? (
        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            maxLength={240}
            placeholder={`chatting as ${player.name.trim()}`}
            className="flex-1 rounded-full border border-black/10 bg-white/80 px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-mute)] focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim()}
            className="btn-pop justify-center disabled:opacity-50"
          >
            Send
          </button>
        </div>
      ) : (
        <SignInForm onSaved={() => setPlayer(loadPlayer())} initial={player} />
      )}
    </div>
  );
}

/** Inline sign-in: same name + wallet identity the leaderboard uses. */
function SignInForm({
  initial,
  onSaved,
}: {
  initial: { name: string; wallet: string };
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [wallet, setWallet] = useState(initial.wallet);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!name.trim()) return setError("Enter a name.");
    if (!isValidSolWallet(wallet.trim())) {
      return setError("Enter a valid Solana wallet — same one you use for the leaderboard.");
    }
    savePlayer(name.trim(), wallet.trim());
    setError(null);
    onSaved();
  };

  return (
    <div className="mt-3">
      <p className="text-xs text-[var(--ink-soft)]">
        Sign in to chat — your name + wallet, same identity as the leaderboard:
      </p>
      <div className="mt-2 flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={18}
          placeholder="your name"
          className="sm:w-40 rounded-full border border-black/10 bg-white/80 px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-mute)] focus:outline-none"
        />
        <input
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="Solana wallet"
          spellCheck={false}
          className="flex-1 rounded-full border border-black/10 bg-white/80 px-4 py-2.5 text-sm font-mono text-[var(--ink)] placeholder:font-sans placeholder:text-[var(--ink-mute)] focus:outline-none"
        />
        <button type="button" onClick={save} className="btn-pop justify-center">
          Join chat
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-[var(--ball-red)]">{error}</p>}
    </div>
  );
}
