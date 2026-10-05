import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import type { Film } from "@/data/types";

export function FilmItem({ film }: { film: Film }) {
  return (
    <AccordionItem value={film.id} className="group border-none">
      <Separator
        aria-hidden="true"
        className="mb-[23px] hidden h-px w-6 bg-current animate-in fade-in duration-200 group-data-[state=open]:block data-horizontal:w-6"
      />
      <AccordionTrigger className="items-start justify-start rounded-none py-0 text-left font-normal hover:no-underline focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-current [&_[data-slot=accordion-trigger-icon]]:hidden">
        <span className="font-serif text-[17.5px] leading-[1.25] font-normal group-hover/accordion-trigger:border-b group-hover/accordion-trigger:border-current max-[389px]:text-[15.5px]">
          {film.title}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        {film.description ? (
          <div className="mt-2">
            <p className="text-sm leading-[1.25] max-[389px]:text-[13px]">
              {film.description}
            </p>
          </div>
        ) : null}
        <Separator
          aria-hidden="true"
          className="mt-6 h-px w-6 bg-current data-horizontal:w-6"
        />
      </AccordionContent>
    </AccordionItem>
  );
}
