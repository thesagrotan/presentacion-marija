import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BioHeaderProps = {
  expanded: boolean;
  onToggle: () => void;
};

export function BioHeader({ expanded, onToggle }: BioHeaderProps) {
  return (
    <div className="absolute top-[var(--pad)] left-[var(--pad)] z-10 w-[min(497px,calc(100vw-var(--pad)*2))] text-sm leading-4 text-ink max-md:static max-md:w-full">
      <span className="uppercase">Marija Arakelyan Lučić</span>
      {" is a filmmaker based in Berlin. "}
      <Button
        type="button"
        variant="link"
        aria-expanded={expanded}
        aria-controls="read-more-panel"
        onClick={onToggle}
        className="h-auto items-baseline rounded-none p-0 text-sm font-normal text-inherit no-underline hover:underline"
      >
        <span className="grid text-left">
          <span
            aria-hidden={expanded}
            className={cn(
              "col-start-1 row-start-1 transition-opacity duration-150",
              expanded ? "opacity-0" : "opacity-100",
            )}
          >
            read more
          </span>
          <span
            aria-hidden={!expanded}
            className={cn(
              "col-start-1 row-start-1 transition-opacity duration-150",
              expanded ? "opacity-100" : "opacity-0",
            )}
          >
            close
          </span>
        </span>
      </Button>
    </div>
  );
}
