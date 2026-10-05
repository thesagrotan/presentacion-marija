import { motion } from "motion/react";
import type { Film } from "@/data/types";
import { CreditsContent } from "./Credits";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

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
  const hasCredits = Boolean(
    film.credits.left.trim() || film.credits.right.trim(),
  );

  return (
    <motion.figure
      className="relative m-0 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.42, ease: EASE_OUT } }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      <img
        className="aspect-[256/135] w-full bg-black/5 object-cover object-center max-md:aspect-video"
        src={film.still}
        alt={`Still from ${film.title}`}
      />
      {hasCredits ? (
        <div className="mt-5 max-md:mt-4">
          <div className="flex justify-end px-[32px] max-md:justify-start">
            <CreditsToggle
              open={creditsOpen}
              onToggle={() => onCreditsChange(!creditsOpen)}
            />
          </div>
          <div
            id="film-credits"
            role="region"
            aria-label="Film credits"
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-[240ms] ease-in-out-strong",
              creditsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="pt-4">
                <CreditsContent film={film} />
              </div>
            </div>
          </div>
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
