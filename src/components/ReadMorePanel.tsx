import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aboutParagraphs } from "@/data/about";
import { filmography } from "@/data/filmography";

type ReadMorePanelProps = {
  open: boolean;
};

export function ReadMorePanel({ open }: ReadMorePanelProps) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          className="fixed top-[calc(var(--pad)+48px)] bottom-[var(--pad)] left-[var(--pad)] z-30 w-[min(549px,calc(100vw-var(--pad)*2))] bg-film-bg text-bio transition-colors duration-500 max-md:top-[calc(var(--pad)+64px)] max-md:w-[calc(100vw-var(--pad)*2)]"
          id="read-more-panel"
          aria-label="About and filmography"
          initial={{ opacity: 0, transform: reduced ? "translateY(0px)" : "translateY(-8px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          exit={{ opacity: 0, transform: reduced ? "translateY(0px)" : "translateY(-8px)" }}
          transition={{ duration: reduced ? 0.01 : 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <ScrollArea className="h-full w-full">
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
