import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { films as allFilms } from "@/data/films";
import { Accordion } from "@/components/Accordion";
import { BioHeader } from "@/components/BioHeader";
import { FilmDetail } from "@/components/FilmDetail";
import { ReadMorePanel } from "@/components/ReadMorePanel";
import { cn } from "@/lib/utils";
import { EASE_IN_OUT } from "@/lib/ease";

const HOME_BG = "#FFFFFF";
const FILM_TEXT = "#12140B";

export function Portfolio() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const [readMoreTop, setReadMoreTop] = useState<number | null>(null);
  const [detailPresent, setDetailPresent] = useState(false);
  const reduced = useReducedMotion();
  const headerRef = useRef<HTMLDivElement | null>(null);

  const activeFilm = useMemo(
    () => allFilms.find((film) => film.id === activeId) ?? null,
    [activeId],
  );

  const handleFilmChange = (id: string | null) => {
    if (id) setDetailPresent(true);
    setActiveId(id);
    setCreditsOpen(false);
  };

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => setReadMoreTop(header.getBoundingClientRect().bottom);
    measure();
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, []);

  const detailVisible = Boolean(activeFilm) || detailPresent;

  const bg = activeFilm ? activeFilm.theme.bg : HOME_BG;
  const text = activeFilm ? activeFilm.theme.text : FILM_TEXT;

  const themeVars = {
    "--film-bg": bg,
    "--film-text": text,
    ...(readMoreTop != null ? { "--readmore-top": `${readMoreTop}px` } : {}),
  } as CSSProperties;

  return (
    <motion.div
      className="relative min-h-dvh overflow-x-hidden text-ink max-md:flex max-md:flex-col max-md:p-[var(--pad)]"
      initial={false}
      animate={{ backgroundColor: bg }}
      transition={{ duration: reduced ? 0.01 : activeFilm ? 0.4 : 0.42, ease: EASE_IN_OUT }}
      style={themeVars}
      data-readmore={readMore}
    >
      <div
        className="absolute inset-0 flex items-center gap-[var(--gap)] pl-[var(--pad)] max-md:static max-md:flex-1 max-md:flex-col max-md:items-stretch max-md:justify-center max-md:gap-8 max-md:pl-0 data-[expanded=true]:max-md:justify-start"
        data-expanded={activeFilm ? "true" : "false"}
      >
        <div className="portfolio-column flex shrink-0 flex-col gap-6 md:w-[260px] lg:w-[300px]">
          <div ref={headerRef}>
            <BioHeader expanded={readMore} onToggle={() => setReadMore((v) => !v)} />
          </div>
          <Accordion
            films={allFilms}
            activeId={activeId}
            onValueChange={handleFilmChange}
          />
        </div>
        <div
          className={cn(
            "min-w-0 items-center [&>*]:col-start-1 [&>*]:row-start-1",
            detailVisible
              ? "grid flex-1 grid-cols-1 grid-rows-1 max-md:block max-md:flex-none"
              : "hidden",
            readMore && "invisible",
          )}
        >
          <AnimatePresence onExitComplete={() => setDetailPresent(false)}>
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
