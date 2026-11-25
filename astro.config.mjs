// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkWikiLinks from './src/lib/remark-wikilinks.mjs';

const PREACT_DEPS = ['preact', 'preact/hooks', 'preact/jsx-runtime', 'preact/devtools', 'preact/debug', 'd3-force'];

// Every page is prerendered to static HTML by default and served from
// Workers Static Assets. The Cloudflare adapter is kept so individual routes
// (comments, feedback, search) can opt into on-demand rendering later with
// `export const prerender = false`.
export default defineConfig({
  // Used for canonical and Open Graph URLs.
  site: 'https://learn.prefill.here',
  // `compile` optimizes images at build time, and sessions are off, so the
  // Worker needs no KV namespace or Images binding until a feature uses one.
  adapter: cloudflare({ imageService: 'compile' }),
  session: false,
  integrations: [mdx(), preact()],
  vite: {
    // In dev, Workers' module runner can load a second copy of preact for
    // preact/hooks, which breaks hooks during SSR ("reading '__H'").
    // Pre-bundling them up front also stops the first page load from
    // triggering a mid-request re-optimize.
    resolve: { dedupe: ['preact', 'preact/hooks', 'preact/compat'] },
    optimizeDeps: { include: PREACT_DEPS },
    environments: { ssr: { optimizeDeps: { include: PREACT_DEPS } } },
  },
  markdown: {
    remarkPlugins: [remarkMath, remarkWikiLinks],
    rehypePlugins: [rehypeKatex],
  },
});
