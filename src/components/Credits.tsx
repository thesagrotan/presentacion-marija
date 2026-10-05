import { motion, useReducedMotion } from "motion/react";
import type { Film } from "@/data/types";

export function Credits({ film }: { film: Film }) {
  const reduced = useReducedMotion();
  const left = film.credits.left.trim();
  const right = film.credits.right.trim();

  if (!left && !right) {
    return null;
  }

  return (
    <motion.figcaption
      className="absolute inset-x-0 top-[calc(100%+40px)] grid grid-cols-2 gap-x-[27px] pr-[var(--pad)] text-xs leading-[14px] text-ink transition-colors duration-500 max-md:static max-md:mt-8 max-md:grid-cols-1 max-md:gap-y-4 max-md:pr-0 max-md:leading-[15px]"
      initial={{ opacity: 0, transform: reduced ? "translateY(0px)" : "translateY(4px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.01 : 0.25, ease: [0.23, 1, 0.32, 1], delay: reduced ? 0 : 0.06 }}
    >
      {left ? (
        <div className="whitespace-pre-line">{film.credits.left}</div>
      ) : null}
      {right ? (
        <div className="whitespace-pre-line">{film.credits.right}</div>
      ) : null}
    </motion.figcaption>
  );
}
