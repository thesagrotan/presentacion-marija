import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  useAccordionItemOpen,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Film } from "@/data/types";

export function FilmItem({ film }: { film: Film }) {
  return (
    <AccordionItem value={film.id} className="group border-none">
      <FilmItemBody film={film} />
    </AccordionItem>
  );
}

function FilmItemBody({ film }: { film: Film }) {
  const open = useAccordionItemOpen();

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "grid transition-[grid-template-rows] ease-in-out-strong",
          open
            ? "grid-rows-[1fr] duration-[240ms]"
            : "grid-rows-[0fr] duration-[420ms]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <Separator
            className={cn(
              "mb-4 h-px w-full origin-left bg-current transition-[transform,opacity] duration-[400ms] ease-out-strong data-horizontal:w-full",
              open ? "scale-x-100 opacity-40" : "scale-x-0 opacity-0"
            )}
          />
        </div>
      </div>
      <AccordionTrigger className="origin-left items-start justify-start rounded-none py-0 text-left font-normal transition-transform duration-150 ease-out hover:no-underline focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-current active:scale-[0.97] [&_[data-slot=accordion-trigger-icon]]:hidden">
        <span className="font-serif text-[17.5px] leading-[1.25] font-normal group-hover/accordion-trigger:underline group-hover/accordion-trigger:underline-offset-[3px] max-[389px]:text-[15.5px]">
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
          className={cn(
            "mt-4 h-px w-full origin-left bg-current transition-[transform,opacity] duration-[400ms] ease-out-strong data-horizontal:w-full",
            open ? "scale-x-100 opacity-40" : "scale-x-0 opacity-0"
          )}
        />
      </AccordionContent>
    </>
  );
}
