"use client";

import { useState } from "react";

/**
 * Renders a token's real logo from the fomo API (`BoardToken.image`). Falls
 * back to a branded letter chip when the token has no image or the URL fails
 * to load, so the board never shows a broken image.
 */
export default function TokenLogo({
  image,
  symbol,
  size = 32,
}: {
  image?: string;
  symbol: string;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const letter = (symbol || "?").charAt(0).toUpperCase();

  if (image && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={symbol}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setBroken(true)}
        className="shrink-0 rounded-full border border-border-soft bg-surface-2 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-brand/15 font-display font-bold text-brand-bright"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {letter}
    </span>
  );
}
