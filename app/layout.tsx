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
              <a href="/" className="text-xl font-bold tracking-tight">
                Clawsights
              </a>
            </div>
          </header>
          <main className="flex-1 px-6">{children}</main>
          <footer className="border-t border-zinc-800 px-6 py-4 text-xs text-zinc-600">
            <div className="max-w-5xl mx-auto grid grid-cols-3 items-center">
              <a
                href="https://x.com/pat_erichsen"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-label="X">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <span className="text-center">
                Upload your stats with{" "}
                <code className="text-zinc-400">/clawsights</code> in Claude Code
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
