"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Standard loading state for every view. */
export function ViewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading data" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

/** Standard error state for every view. */
export function ViewError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center"
    >
      <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" aria-hidden="true" />
      <p className="font-semibold text-foreground">Something went wrong</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Retry
        </Button>
      ) : null}
    </motion.div>
  );
}
