"use client";

import { motion } from "framer-motion";

interface ViewHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}

export function ViewHeader({ title, description, eyebrow, actions }: ViewHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-500">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </motion.div>
  );
}
