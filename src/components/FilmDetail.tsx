import { motion, useReducedMotion } from "motion/react";
import type { Film } from "@/data/types";
import { Credits } from "./Credits";

export function FilmDetail({ film }: { film: Film }) {
  const reduced = useReducedMotion();

  return (
    <motion.figure
      className="relative m-0 w-full"
      initial={{ opacity: 0, transform: reduced ? "scale(1)" : "scale(1.02)" }}
      animate={{ opacity: 1, transform: "scale(1)" }}
      exit={{ opacity: 0, transition: { duration: reduced ? 0.01 : 0.2, ease: [0.23, 1, 0.32, 1] } }}
      transition={{ duration: reduced ? 0.01 : 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <img
        className="aspect-[256/135] w-full bg-black/5 object-cover object-center max-md:aspect-video"
        src={film.still}
        alt={`Still from ${film.title}`}
      />
      <Credits film={film} />
    </motion.figure>
  );
}
