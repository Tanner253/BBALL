"use client";

import Image from "next/image";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Meme } from "@/data/memes";

type Props = {
  meme: Meme;
  onClose: () => void;
  onCopyImage: () => void;
  onCopyCaption: () => void;
  onDownload: () => void;
  copied: "image" | "caption" | null;
  downloading: boolean;
};

/**
 * Full-size preview lightbox for a single meme.
 *
 * - Renders to <body> via portal so it always sits above everything.
 * - Esc closes; clicking the backdrop closes; clicking the image does nothing.
 * - Locks body scroll while open.
 * - Reuses the parent card's clipboard / download handlers — no duplicated logic.
 */
export function MemePreview({
  meme,
  onClose,
  onCopyImage,
  onCopyCaption,
  onDownload,
  copied,
  downloading,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={meme.title}
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm meme-preview-fade"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-[min(96vw,1100px)] max-h-[92vh] w-full flex flex-col gap-3 outline-none"
      >
        <div
          className="relative flex-1 min-h-0 rounded-2xl overflow-hidden border border-white/15"
          style={{
            background:
              "linear-gradient(135deg, var(--sand-light) 0%, #ffffff 55%, var(--sky-1) 100%)",
            aspectRatio: meme.aspect,
            maxHeight: "calc(92vh - 110px)",
          }}
        >
          <Image
            src={meme.src}
            alt={meme.title}
            fill
            sizes="(min-width: 1100px) 1100px, 96vw"
            className="object-contain"
            priority
          />
        </div>

        {/* Caption */}
        {meme.caption && (
          <p className="text-white/85 text-sm whitespace-pre-line text-center max-w-2xl mx-auto px-2">
            {meme.caption}
          </p>
        )}

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onCopyImage}
            className={`btn-pop !text-xs sm:!text-sm ${
              copied === "image" ? "!bg-[var(--ball-green)] !text-white" : ""
            }`}
          >
            {copied === "image" ? "Image copied" : "Copy image"}
          </button>
          {meme.caption && (
            <button
              type="button"
              onClick={onCopyCaption}
              className={`btn-ghost !text-xs sm:!text-sm !bg-white/15 !border-white/30 !text-white hover:!bg-white/25 ${
                copied === "caption" ? "!border-[var(--ball-green)]" : ""
              }`}
            >
              {copied === "caption" ? "Caption copied" : "Copy caption"}
            </button>
          )}
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="btn-ghost !text-xs sm:!text-sm !bg-white/15 !border-white/30 !text-white hover:!bg-white/25"
          >
            {downloading ? "Downloading…" : "Download"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost !text-xs sm:!text-sm !bg-white/15 !border-white/30 !text-white hover:!bg-white/25"
            aria-label="Close preview"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
