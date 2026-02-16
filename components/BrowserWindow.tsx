"use client";

import { useState, useEffect, useCallback } from "react";
import { ReportButton } from "./ReportButton";

interface BrowserWindowProps {
  handle: string;
}

export function BrowserWindow({ handle }: BrowserWindowProps) {
  const [fullscreen, setFullscreen] = useState(false);

  const close = useCallback(() => setFullscreen(false), []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fullscreen, close]);

  const wrapperClass = fullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-slate-50"
    : "rounded-xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-400/20 flex-1 flex flex-col min-h-0 max-h-[calc(100vh-10rem)] sm:max-h-none";

  const iframeClass = fullscreen
    ? "w-full border-0 flex-1"
    : "w-full border-0 flex-1";

  return (
    <div className={wrapperClass}>
      {/* Tab bar – desktop only */}
      <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-slate-100 border-b border-slate-200">
        <div className="flex gap-1.5">
          <a href="/" title="Back to leaderboard" className="w-3 h-3 rounded-full bg-red-500/80 block" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <button
            onClick={() => setFullscreen((f) => !f)}
            title={fullscreen ? "Exit full screen" : "Enter full screen"}
            className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-400 transition-colors cursor-pointer"
          />
        </div>
        <div className="ml-auto">
          <ReportButton handle={handle} />
        </div>
      </div>
      {/* URL bar – desktop */}
      <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-100 border-b border-slate-200">
        <a
          href="/"
          title="Back to leaderboard"
          className="p-0.5 rounded text-slate-400 hover:text-slate-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </a>
        <span className="p-0.5 text-slate-300 cursor-default">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </span>
        <span className="p-0.5 text-slate-300 cursor-default">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.992 4.012v4.992" />
          </svg>
        </span>
        <div className="flex-1 flex items-center gap-2 bg-white rounded-md px-3 py-1.5">
          <span className="text-[11px] font-medium text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
            File
          </span>
          <span className="text-xs text-slate-500 font-mono truncate">
            ~/.claude/usage-data/report.html
          </span>
        </div>
      </div>
      {/* URL bar – mobile */}
      <div className="flex sm:hidden items-center gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200">
        <a
          href="/"
          title="Back to leaderboard"
          className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </a>
        <div className="flex-1 flex items-center bg-white rounded-md px-3 py-1.5 min-w-0">
          <span className="text-xs text-slate-500 font-mono truncate">
            ~/.claude/usage-data/report.html
          </span>
        </div>
        <div className="shrink-0">
          <ReportButton handle={handle} />
        </div>
      </div>
      {/* Iframe */}
      <iframe
        src={`/api/report/${handle}`}
        className={iframeClass}
        title={`${handle}'s Claude Code Insights`}
      />
    </div>
  );
}
