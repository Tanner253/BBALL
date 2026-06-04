"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { clsx } from "clsx";
import type { Meme } from "@/data/memes";
import { MemePreview } from "./MemePreview";

type Props = {
  meme: Meme;
  priority?: boolean;
};

export function MemeCard({ meme, priority }: Props) {
  const [copied, setCopied] = useState<"image" | "caption" | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const flash = (kind: "image" | "caption") => {
    setCopied(kind);
    setTimeout(() => setCopied(null), 1600);
  };

  const copyImage = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(meme.src);
      const blob = await res.blob();
      // Convert to PNG if needed for clipboard support
      const supportsFn = (
        ClipboardItem as unknown as { supports?: (t: string) => boolean }
      ).supports;
      const supported =
        typeof ClipboardItem !== "undefined" &&
        (supportsFn ? supportsFn(blob.type) : blob.type === "image/png");

      if (!supported && blob.type !== "image/png") {
        // Re-encode through canvas to PNG
        const png = await blobToPng(blob);
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": png }),
        ]);
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      }
      flash("image");
    } catch (e) {
      console.warn(e);
      setError("Couldn't copy image. Try Download instead.");
    }
  }, [meme.src]);

  const copyCaption = useCallback(async () => {
    if (!meme.caption) return;
    try {
      await navigator.clipboard.writeText(meme.caption);
      flash("caption");
    } catch {
      setError("Couldn't copy caption.");
    }
  }, [meme.caption]);

  const download = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch(meme.src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = meme.src.split(".").pop() || "png";
      a.download = `bball-${meme.slug}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }, [meme.src, meme.slug]);

  // Image memes are laid out in a uniform square grid (object-contain so
  // nothing gets cropped). Quote screenshots keep their natural aspect since
  // they're designed as readable horizontal strips.
  const isQuote = meme.category === "quote";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/55 backdrop-blur-md shadow-[0_10px_30px_-15px_rgba(8,50,80,0.3)] hover:shadow-[0_20px_40px_-15px_rgba(8,50,80,0.4)] transition-all duration-300 hover:-translate-y-0.5">
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        aria-label={`Preview ${meme.title}`}
        className="relative w-full overflow-hidden block cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ball-yellow)]"
        style={{
          aspectRatio: isQuote ? meme.aspect : 1,
          background: isQuote
            ? "#ffffff"
            : "linear-gradient(135deg, var(--sand-light) 0%, #ffffff 55%, var(--sky-1) 100%)",
        }}
      >
        <Image
          src={meme.src}
          alt={meme.title}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {/* Subtle expand affordance — only visible on hover/focus, never covers content */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/55 backdrop-blur-md px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Click to view
        </span>
      </button>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-[var(--ink)] leading-tight text-sm line-clamp-1">
          {meme.title}
        </h3>

        {meme.caption && (
          <p className="text-[11px] text-[var(--ink-soft)] line-clamp-2 whitespace-pre-line">
            {meme.caption}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={copyImage}
            className={clsx(
              "btn-pop !py-1 !px-2.5 !text-[11px]",
              copied === "image" && "!bg-[var(--ball-green)] !text-white"
            )}
          >
            {copied === "image" ? "Copied!" : "Copy"}
          </button>
          {meme.caption && (
            <button
              type="button"
              onClick={copyCaption}
              className={clsx(
                "btn-ghost !py-1 !px-2.5 !text-[11px]",
                copied === "caption" &&
                  "!bg-[var(--ball-green)]/15 !text-[var(--ink)] !border-[var(--ball-green)]"
              )}
            >
              {copied === "caption" ? "✓ caption" : "Caption"}
            </button>
          )}
          <button
            type="button"
            onClick={download}
            disabled={downloading}
            className="btn-ghost !py-1 !px-2.5 !text-[11px]"
            aria-label="Download"
            title="Download"
          >
            {downloading ? "…" : "↓"}
          </button>
        </div>

        {error && (
          <p className="text-[11px] text-[var(--ball-red)]">{error}</p>
        )}
      </div>

      {previewOpen && (
        <MemePreview
          meme={meme}
          onClose={() => setPreviewOpen(false)}
          onCopyImage={copyImage}
          onCopyCaption={copyCaption}
          onDownload={download}
          copied={copied}
          downloading={downloading}
        />
      )}
    </article>
  );
}

async function blobToPng(blob: Blob): Promise<Blob> {
  const img = await blobToImage(blob);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encode failed"))),
      "image/png"
    );
  });
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
