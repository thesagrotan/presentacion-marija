import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BioHeaderProps = {
  expanded: boolean;
  onToggle: () => void;
};

export function BioHeader({ expanded, onToggle }: BioHeaderProps) {
  return (
    <div className="w-full text-sm leading-4 text-ink">
      <span className="uppercase tracking-[0.01em]">Marija Arakelyan Lučić</span>
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
              "col-start-1 row-start-1 transition-[opacity,filter] duration-150 ease-out",
              expanded ? "opacity-0 blur-[2px]" : "opacity-100 blur-0",
            )}
          >
            read more
          </span>
          <span
            aria-hidden={!expanded}
            className={cn(
              "col-start-1 row-start-1 transition-[opacity,filter] duration-150 ease-out",
              expanded ? "opacity-100 blur-0" : "opacity-0 blur-[2px]",
            )}
          >
            close
          </span>
        </span>
      </Button>
    </div>
  );
}
