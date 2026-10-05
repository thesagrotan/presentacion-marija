import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Film } from "@/data/types";
import { CreditsContent } from "./Credits";
import { EASE_OUT } from "@/lib/ease";

type FilmDetailProps = {
  film: Film;
  creditsOpen: boolean;
  onCreditsChange: (open: boolean) => void;
};

export function FilmDetail({
  film,
  creditsOpen,
  onCreditsChange,
}: FilmDetailProps) {
  const reduced = useReducedMotion();
  const hasCredits = Boolean(
    film.credits.left.trim() || film.credits.right.trim(),
  );

  return (
    <motion.figure
      className="relative m-0 w-full origin-left max-md:origin-center"
      initial={{ opacity: 0, transform: reduced ? "scale(1)" : "scale(1.02)" }}
      animate={{ opacity: 1, transform: "scale(1)" }}
      exit={
        reduced
          ? { opacity: 0, transition: { duration: 0.1 } }
          : {
              opacity: 0,
              transform: "scale(0.98)",
              transition: { duration: 0.24, ease: EASE_OUT },
            }
      }
      transition={
        reduced
          ? { duration: 0.15 }
          : { type: "spring", bounce: 0, duration: 0.4 }
      }
    >
      <img
        className="aspect-[256/135] w-full bg-black/5 object-cover object-center max-md:aspect-video"
        src={film.still}
        alt={`Still from ${film.title}`}
      />
      {hasCredits ? (
        <div className="mt-5 pr-[var(--pad)] max-md:mt-4 max-md:pr-0">
          <div className="flex justify-end max-md:justify-start">
            <CreditsToggle
              open={creditsOpen}
              onToggle={() => onCreditsChange(!creditsOpen)}
            />
          </div>
          <AnimatePresence initial={false}>
            {creditsOpen ? (
              <motion.div
                key="credits"
                id="film-credits"
                role="region"
                aria-label="Film credits"
                className="overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: reduced ? 0.01 : 0.32,
                  ease: EASE_OUT,
                }}
              >
                <div className="pt-4">
                  <CreditsContent
                    film={film}
                    className="ml-auto w-[min(720px,100%)]"
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </motion.figure>
  );
}

function CreditsToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="film-credits"
      onClick={onToggle}
      className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink/70 underline-offset-[3px] transition-colors duration-150 ease-out-strong hover:text-ink hover:underline focus-visible:text-ink focus-visible:underline focus-visible:outline-none"
    >
      {open ? "Close" : "Credits"}
    </button>
  );
}
