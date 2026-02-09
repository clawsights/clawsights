import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Clawsights — Claude Code Leaderboard",
  description:
    "See where you rank among Claude Code users. Upload your /insights stats and compare your usage across messages, sessions, velocity, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans bg-zinc-950 text-zinc-100 antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-zinc-800 px-6 py-4">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <a href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight">
                  Clawsights
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Claude Code Leaderboard
                </span>
              </a>
              <nav className="flex gap-4 text-sm text-zinc-400">
                <a href="/" className="hover:text-zinc-100 transition-colors">
                  Leaderboard
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-800 px-6 py-4 text-center text-xs text-zinc-600">
            Upload your stats with{" "}
            <code className="text-zinc-400">/clawsights</code> in Claude Code
          </footer>
        </div>
      </body>
    </html>
  );
}
