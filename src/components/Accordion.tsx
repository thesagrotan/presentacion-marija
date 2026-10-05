import { Accordion as AccordionRoot } from "@/components/ui/accordion";
import type { Film } from "@/data/types";
import { FilmItem } from "./FilmItem";

type AccordionProps = {
  films: Film[];
  activeId: string | null;
  onValueChange: (id: string | null) => void;
};

export function Accordion({ films, activeId, onValueChange }: AccordionProps) {
  return (
    <AccordionRoot
      type="single"
      collapsible
      value={activeId ?? ""}
      onValueChange={(value) => onValueChange(value || null)}
      aria-label="Films"
      className="w-full shrink-0 gap-6 text-film transition-[color] duration-300 ease-out-strong md:w-[220px] lg:w-[244px]"
    >
      {films.map((film) => (
        <FilmItem key={film.id} film={film} />
      ))}
    </AccordionRoot>
  );
}
