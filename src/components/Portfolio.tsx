import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { films as allFilms } from "@/data/films";
import { Accordion } from "@/components/Accordion";
import { BioHeader } from "@/components/BioHeader";
import { FilmDetail } from "@/components/FilmDetail";
import { ReadMorePanel } from "@/components/ReadMorePanel";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/ease";

const HOME_BG = "#FFFFFF";
const FILM_TEXT = "#12140B";

export function Portfolio() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const reduced = useReducedMotion();

  const handleFilmChange = (id: string | null) => {
    setActiveId(id);
    setCreditsOpen(false);
  };

  const activeFilm = useMemo(
    () => allFilms.find((film) => film.id === activeId) ?? null,
    [activeId],
  );

  const bg = activeFilm ? activeFilm.theme.bg : HOME_BG;
  const text = activeFilm ? activeFilm.theme.text : FILM_TEXT;

  const themeVars = {
    "--film-bg": bg,
    "--film-text": text,
  } as CSSProperties;

  return (
    <motion.div
      className="relative min-h-dvh overflow-x-hidden text-ink max-md:flex max-md:flex-col max-md:p-[var(--pad)]"
      initial={false}
      animate={{ backgroundColor: bg }}
      transition={{ duration: reduced ? 0.01 : 0.3, ease: EASE_OUT }}
      style={themeVars}
      data-readmore={readMore}
    >
      <BioHeader expanded={readMore} onToggle={() => setReadMore((v) => !v)} />
      <div
        className="absolute inset-0 flex items-center gap-[var(--gap)] pl-[var(--pad)] max-md:static max-md:flex-1 max-md:flex-col max-md:items-stretch max-md:justify-center max-md:gap-8 max-md:pl-0 data-[expanded=true]:max-md:justify-start"
        data-expanded={activeFilm ? "true" : "false"}
      >
        <Accordion
          films={allFilms}
          activeId={activeId}
          onValueChange={handleFilmChange}
        />
        <div
          className={cn(
            "grid min-w-0 flex-1 grid-cols-1 grid-rows-1 items-center [&>*]:col-start-1 [&>*]:row-start-1 max-md:block max-md:flex-none",
            readMore && "invisible",
          )}
        >
          <AnimatePresence>
            {activeFilm && (
              <FilmDetail
                key={activeFilm.id}
                film={activeFilm}
                creditsOpen={creditsOpen}
                onCreditsChange={setCreditsOpen}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
      <ReadMorePanel open={readMore} />
    </motion.div>
  );
}
