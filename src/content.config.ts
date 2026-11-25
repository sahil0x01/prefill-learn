import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Fields every linkable entry shares. `requires` and `related` hold ids of
// any note, widget or project; they are checked in src/lib/graph.ts.
const linkable = {
  title: z.string(),
  /** One sentence. Shown in hover previews, lists and the graph. */
  summary: z.string(),
  /** Chapter in the numbered index. Checked against src/data/topics.ts in
   *  src/lib/graph.ts, so editing topics.ts works without restarting dev. */
  topic: z.string(),
  /** Position within the chapter; entries without one sort by title after it. */
  order: z.number().optional(),
  tags: z.array(z.string()).default([]),
  requires: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
  /** Set when the entry depends on hardware, versions or benchmarks that go stale. */
  verified: z.coerce.date().optional(),
  draft: z.boolean().default(false),
};

/** Atomic notes: one idea each. */
const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object(linkable),
});

/** Interactive tools. Each has its own page and can be embedded in notes. */
const widgets = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/widgets' }),
  schema: z.object(linkable),
});

/** Long, hands-on build guides that link out to notes. */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    ...linkable,
    level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
    time: z.string().optional(),
  }),
});

/** Curated, ordered routes through entries. One entry can be in many paths. */
const paths = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: './src/content/paths' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    steps: z.array(z.string()),
  }),
});

export const collections = { notes, widgets, projects, paths };
