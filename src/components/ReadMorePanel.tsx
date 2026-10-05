import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aboutParagraphs } from "@/data/about";
import { filmography } from "@/data/filmography";
import { EASE_OUT } from "@/lib/ease";

type ReadMorePanelProps = {
  open: boolean;
};

export function ReadMorePanel({ open }: ReadMorePanelProps) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          className="fixed top-[calc(var(--pad)+48px)] bottom-[var(--pad)] left-[var(--pad)] z-30 w-[min(549px,calc(100vw-var(--pad)*2))] origin-top-left bg-film-bg text-bio transition-colors duration-300 ease-out-strong shadow-[0_8px_30px_rgba(0,0,0,0.08)] max-md:top-[calc(var(--pad)+64px)] max-md:w-[calc(100vw-var(--pad)*2)]"
          id="read-more-panel"
          aria-label="About and filmography"
          initial={reduced ? { opacity: 0 } : { opacity: 0, transform: "scale(0.98)" }}
          animate={{ opacity: 1, transform: "scale(1)" }}
          exit={
            reduced
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  transform: "scale(0.98)",
                  transition: { duration: 0.24, ease: EASE_OUT },
                }
          }
          transition={{ duration: reduced ? 0.01 : 0.3, ease: EASE_OUT }}
        >
          <ScrollArea className="h-full w-full" edgeFade>
            <div className="flex flex-col gap-5 pr-3 max-md:pr-1">
              {aboutParagraphs.map((paragraph, index) => (
                <p
                  className="text-sm leading-5 max-[389px]:text-[13px]"
                  key={index}
                >
                  {paragraph}
                </p>
              ))}
              <div className="mt-8 text-sm leading-4 max-[389px]:text-[13px]">
                <div className="uppercase">{filmography.heading}</div>
                <div className="mt-4 whitespace-pre-line">
                  {filmography.body}
                </div>
              </div>
            </div>
          </ScrollArea>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
