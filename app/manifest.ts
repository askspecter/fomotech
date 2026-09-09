import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PEA · fomo companion",
    short_name: "PEA",
    description:
      "PEA. Analytics, leaderboard, live feed, trader explorer, copytrade, and a PONS v2 launchpad for the fomo social trading ecosystem.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#080b16",
    theme_color: "#080b16",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
