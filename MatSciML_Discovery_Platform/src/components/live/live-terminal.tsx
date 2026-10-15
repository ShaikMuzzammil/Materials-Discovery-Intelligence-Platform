"use client";

/**
 * LIVE TERMINAL — monospace streaming log with colored levels, auto-scroll,
 * pause-on-scroll-up and a level filter.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, TerminalSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { MAX_LOG_LINES, useLiveRunStore } from "@/lib/live-run-store";
import type { LogLine } from "@/lib/engine/types";

const LEVEL_STYLES: Record<LogLine["level"], string> = {
  info: "text-sky-300",
  ok: "text-emerald-400",
  warn: "text-amber-300",
  result: "text-teal-300",
};

const LEVEL_PREFIX: Record<LogLine["level"], string> = {
  info: "···",
  ok: " ✓ ",
  warn: " ! ",
  result: " » ",
};

type LevelFilter = "all" | LogLine["level"];

const FILTERS: { key: LevelFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "info", label: "Info" },
  { key: "ok", label: "OK" },
  { key: "warn", label: "Warn" },
  { key: "result", label: "Results" },
];

const RENDER_WINDOW = 220;

export function LiveTerminal() {
  const logs = useLiveRunStore((s) => s.logs);
  const running = useLiveRunStore((s) => s.running);
  const [filter, setFilter] = useState<LevelFilter>("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const visible = filter === "all" ? logs : logs.filter((l) => l.level === filter);
  const window = visible.length > RENDER_WINDOW ? visible.slice(-RENDER_WINDOW) : visible;

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const onScroll = (): void => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    if (!atBottom && autoScroll) setAutoScroll(false);
    if (atBottom && !autoScroll) setAutoScroll(true);
  };

  return (
    <section
      aria-label="Live pipeline terminal"
      className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-border bg-[#07130f]"
    >
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-emerald-900/50 bg-emerald-950/40 px-3 py-2">
        <TerminalSquare className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
        <p className="mr-auto text-xs font-semibold text-emerald-300">
          engine://live-pipeline
          {running ? (
            <motion.span
              className="ml-2 inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-400"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2 }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              LIVE
            </motion.span>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Log level filter">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                filter === f.key
                  ? "bg-emerald-500/25 text-emerald-300"
                  : "text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAutoScroll((v) => !v)}
          aria-pressed={autoScroll}
          className="h-6 gap-1 px-2 text-[10px] text-emerald-300 hover:bg-emerald-500/15 hover:text-emerald-200"
        >
          {autoScroll ? <Pause className="h-3 w-3" aria-hidden="true" /> : <Play className="h-3 w-3" aria-hidden="true" />}
          {autoScroll ? "Pause" : "Follow"}
        </Button>
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="live-terminal min-h-0 flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed"
        role="log"
        aria-live="polite"
        aria-label="Streaming engine log"
      >
        {window.length === 0 ? (
          <p className="text-emerald-800">$ engine idle — configure a run and press “Run Full Pipeline”.</p>
        ) : (
          <AnimatePresence initial={false}>
            {window.map((line, i) => (
              <motion.div
                key={`${line.ts}-${i}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className="flex gap-2 whitespace-pre-wrap break-words"
              >
                <span className="shrink-0 text-emerald-900" aria-hidden="true">
                  {new Date(line.ts).toLocaleTimeString("en-GB", { hour12: false })}
                </span>
                <span className={`shrink-0 ${LEVEL_STYLES[line.level]}`} aria-hidden="true">
                  {LEVEL_PREFIX[line.level]}
                </span>
                <span className={line.level === "ok" ? "text-emerald-300" : "text-emerald-100/90"}>{line.msg}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-emerald-900/50 bg-emerald-950/40 px-3 py-1.5 text-[10px] text-emerald-700">
        <span>
          {visible.length.toLocaleString("en-US")} lines{filter !== "all" ? ` (${logs.length.toLocaleString("en-US")} total)` : ""}
        </span>
        <span>buffer {MAX_LOG_LINES}</span>
      </footer>
    </section>
  );
}
