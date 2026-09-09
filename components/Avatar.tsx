"use client";

import { useState } from "react";

/**
 * Deterministic hue from a string, constrained to a cool blue→violet band
 * (205–285°) so identicons stay on-palette with the app's steel-blue theme.
 */
function hue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return 205 + (h % 80);
}

/**
 * Trader avatar. Renders the real fomo profile picture when a URL is available;
 * otherwise a stable gradient identicon seeded from the handle so every row has
 * a visible, consistent profile mark (no credits spent).
 */
export default function Avatar({
  image,
  handle,
  size = 38,
}: {
  image?: string;
  handle: string;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const letter = (handle || "?").replace(/^@/, "").charAt(0).toUpperCase();

  if (image && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={handle}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setBroken(true)}
        className="shrink-0 rounded-full border border-border-soft object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const h = hue(handle || "x");
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full border border-border-soft font-display font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundImage: `linear-gradient(135deg, hsl(${h} 55% 46%), hsl(${h - 20} 50% 26%))`,
      }}
    >
      {letter}
    </span>
  );
}
