import type { Metadata, Viewport } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "PEA",
    template: "%s · PEA",
  },
  description:
    "PEA. Analytics, leaderboard, live feed, trader explorer, copytrade, and a PONS v2 launchpad for the fomo social trading ecosystem.",
};

export const viewport: Viewport = {
  themeColor: "#080b16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg font-sans text-[#eceef5]">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
          </div>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
