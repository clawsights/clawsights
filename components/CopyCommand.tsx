"use client";

import { useState } from "react";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-sm">
      <div className="overflow-x-auto min-w-0 px-4 py-3">
        <span className="whitespace-nowrap text-zinc-100">{command}</span>
      </div>
      <button
        onClick={handleCopy}
        className="ml-auto px-4 py-3 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 border-l border-zinc-800"
        aria-label="Copy command"
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        )}
      </button>
    </div>
  );
}
