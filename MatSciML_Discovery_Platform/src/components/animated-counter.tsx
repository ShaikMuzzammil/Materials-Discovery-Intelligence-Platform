"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  /** Custom formatter (decimals, thousands separators, …) */
  format?: (value: number) => string;
  className?: string;
  "aria-label"?: string;
}

function defaultFormat(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

/**
 * Animated number counter built on framer-motion's useMotionValue + animate.
 * Renders 0 on the server AND on the first client render (no hydration
 * mismatch), then springs to the target value after mount.
 */
export function AnimatedCounter({
  value,
  duration = 1.4,
  format = defaultFormat,
  className,
  "aria-label": ariaLabel,
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, (latest) => format(latest));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [motionValue, value, duration]);

  return (
    <motion.span className={className} aria-label={ariaLabel}>
      {text}
    </motion.span>
  );
}
