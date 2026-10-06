import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const films = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/films" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number().default(0),
      still: image(),
      bg: z.string(),
      text: z.string(),
      credits: z
        .object({ left: z.string().default(""), right: z.string().default("") })
        .default({ left: "", right: "" }),
      draft: z.boolean().default(false),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({ title: z.string(), heading: z.string().optional() }),
});

export const collections = { films, pages };
