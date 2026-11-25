# Prefill Learn

Prefill's open notebook on inference engineering, at **https://learn.prefill.here**: short notes, calculators and hands-on projects, all linked together. Built with Astro and served as static files from a Cloudflare Worker (`prefill-learn`).

Source: https://github.com/sahil0x01/prefill-learn. Spotted a mistake? Open an issue or a pull request.

```bash
npm install      # once
npm run dev      # http://localhost:4321, reloads as you edit
npm run build    # checks every link and every frontmatter field
npm run deploy   # build + upload to Cloudflare (run `npx wrangler login` once first)
```

The site starts empty. This guide walks you through adding each kind of content.

---

## Your first note in 4 steps

**1. Pick or add a chapter.** Open `src/data/topics.ts`. Every entry belongs to one chapter in the numbered index on the home page. The chapters follow the roadmap, from the basics to research notes:

```ts
export const topics = [
  { id: 'foundations', title: 'Foundations' },
  { id: 'cpu-baseline', title: 'A naive engine on CPU' },
  { id: 'cpu-performance', title: 'Making the CPU fast' },
  // ...through 'research'
] as const;
```

To add a chapter, add a line. List order is display order, so the first chapter is `1.`, the second `2.`, and so on. Chapters with no entries are hidden.

**2. Create the file.** Create `src/content/notes/prefill.md`. The file name becomes the **id** (`prefill`) and the URL (`/notes/prefill/`). Use lowercase words joined by hyphens.

**3. Add frontmatter and the text:**

```md
---
title: Prefill
summary: The first phase of a request, where the model processes the whole prompt in one forward pass.
topic: foundations
---

During prefill the model runs every prompt token through the network at once...
```

**4. Check it.** With `npm run dev` running, open http://localhost:4321. The note appears in the index as `1.1`. Run `npm run build` before you commit. It fails with a clear message if anything is wrong.

That's all a note needs: `title`, `summary` and `topic`. Everything else is optional.

---

## The four kinds of content

| Kind | Folder | File | URL | Use it for |
|---|---|---|---|---|
| **Note** | `src/content/notes/` | `.md` or `.mdx` | `/notes/<id>/` | One idea. Usually 50–400 words. |
| **Widget** | `src/content/widgets/` | `.mdx` | `/widgets/<id>/` | A calculator or interactive tool, on its own page. |
| **Project** | `src/content/projects/` | `.md` or `.mdx` | `/projects/<id>/` | A long, hands-on build guide. |
| **Path** | `src/content/paths/` | `.yaml` | `/paths/<id>/` | An ordered route through existing entries. |

Notes, widgets and projects share one id space. Two files can't have the same name across those three folders, even in different folders.

Use `.md` for plain text. Use `.mdx` when the page embeds a widget, since MDX allows `import` and components.

---

## Frontmatter reference

Notes, widgets and projects all accept these fields:

| Field | Required | Example | What it does |
|---|---|---|---|
| `title` | yes | `KV Cache` | Page title. Also the link text for `[[kv-cache]]`. |
| `summary` | yes | `Stored keys and values for past tokens.` | One sentence. Shown under the title, in lists, in hover previews and in the graph. |
| `topic` | yes | `foundations` | Chapter in the index. Must be an `id` from `src/data/topics.ts`. |
| `order` | no | `2` | Position within the chapter. Entries without one come after, sorted by title. |
| `requires` | no | `[prefill, decode]` | Prerequisites. Shown in a "Before this" box at the top, and as arrows in the graph. |
| `related` | no | `[kv-cache-calculator]` | Shown in a "Related" list at the bottom. |
| `tags` | no | `[memory, attention]` | Shown in the page meta row. |
| `verified` | no | `2026-11-25` | The date you last checked numbers that go stale (GPU specs, library versions, benchmarks). Shown as "Verified Nov 25, 2026". |
| `draft` | no | `true` | Shows in `npm run dev`, hidden from the built site. |

Projects can also set:

| Field | Example | Values |
|---|---|---|
| `level` | `beginner` | `beginner`, `intermediate` (default), `advanced` |
| `time` | `1–2 hours` | Any text |

`requires` and `related` take ids of any note, widget or project. A misspelled id fails the build.

---

## Linking

Links between entries are what make the site work. There are three ways to link:

```md
The cache is filled during [[prefill]].             → link text is the entry's title: "Prefill"
This is why [[decode-is-memory-bound|decode is slow]]. → custom link text
```

```yaml
requires: [prefill]   # "you should read this first"
related: [kv-cache-calculator]   # "see also"
```

From these, the site generates:

- **"Linked from"** at the bottom of every page that something points to.
- **Hover previews.** Hovering a link shows the target's title and summary.
- **The graph** at `/graph/`. Solid arrows are `requires`, dotted lines are `[[links]]` and `related`.

You can link to an entry before it has any text. Create the file with frontmatter and `draft: true`, and the link works in dev.

---

## Math

Inline math goes in `$...$`, and display math in `$$...$$`. KaTeX renders it.

```md
Each step reads about $2 \times N$ bytes of weights:

$$
t_\text{step} \approx \frac{\text{weight bytes}}{\text{bandwidth}}
$$
```

---

## Adding a widget

A widget is a Preact component. It gets its own page and can be embedded in any `.mdx` note. Follow these steps in order.

**1. Put numbers in the data files, not in components.**
GPU specs are in `src/data/hardware.ts` and model configs in `src/data/models.ts`. Add what you need there, with a `source` link and a `verified` date. Every widget reads from these files, so fixing a spec fixes it everywhere.

**2. Put formulas in `src/lib/inference.ts`.**
Keep them as plain functions with no UI code. Some already exist: `kvBytesPerToken`, `weightBytes` and `formatBytes`.

**3. Write the component** at `src/components/widgets/WeightMemory.tsx`. This template already has the pixel styling:

```tsx
import { useState } from 'preact/hooks';
import { models, DTYPE_BYTES, type Dtype } from '../../data/models';
import { weightBytes, formatBytes } from '../../lib/inference';
import './widget.css';

interface Props {
  model?: string; // lets a note open the widget on its own example
}

export default function WeightMemory(props: Props) {
  const [modelId, setModelId] = useState(props.model ?? models[0].id);
  const [dtype, setDtype] = useState<Dtype>('bf16');
  const m = models.find((x) => x.id === modelId)!;

  return (
    <div class="widget nf-pixel">
      <div class="widget__bar">
        <span class="nf-label">Weight memory</span>
      </div>
      <div class="widget__body">
        <div class="widget__controls">
          <label>
            <span class="nf-label">Model</span>
            <select value={modelId} onChange={(e) => setModelId(e.currentTarget.value)}>
              {models.map((x) => <option value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <label>
            <span class="nf-label">Dtype</span>
            <select value={dtype} onChange={(e) => setDtype(e.currentTarget.value as Dtype)}>
              {(['bf16', 'fp8', 'int4'] as Dtype[]).map((d) => <option value={d}>{d.toUpperCase()}</option>)}
            </select>
          </label>
        </div>
        <dl class="widget__stats nf-pixel-inset">
          <div><dt class="nf-label">Weights</dt><dd>{formatBytes(weightBytes(m, DTYPE_BYTES[dtype]))}</dd></div>
        </dl>
      </div>
    </div>
  );
}
```

These classes come from `widget.css`:

| Class | Use |
|---|---|
| `widget nf-pixel` | Outer frame |
| `widget__bar` | Title strip |
| `widget__body` | Two columns on desktop, one on mobile |
| `widget__controls` | Stacked inputs. `<select>` and `<input type="range">` are styled automatically |
| `widget__stats nf-pixel-inset` | Grid of big numbers (`<dt>` label, `<dd>` value) |
| `verdict verdict--ok` / `verdict--bad` | A one-line conclusion |
| `widget__note` | Small print about assumptions |

**4. Give it a page** at `src/content/widgets/weight-memory.mdx`:

```mdx
---
title: Weight Memory
summary: How much GPU memory a model's weights take at each precision.
topic: foundations
verified: 2026-11-25
---
import WeightMemory from '../../components/widgets/WeightMemory';

<WeightMemory client:load />

The formula is parameters × bytes per parameter.
```

**5. Embed it in notes.** Rename the note to `.mdx` if it's `.md`, then:

```mdx
import WeightMemory from '../../components/widgets/WeightMemory';

<WeightMemory client:visible model="llama-3.1-70b" />
```

Use `client:load` on the widget's own page, where it's the main thing on screen. Use `client:visible` inside notes, so it only loads when scrolled into view. Without a `client:` directive the widget renders but doesn't respond to input.

---

## Adding a project

Projects are long, step-by-step guides. Write them like notes, with `##` headings for steps. Link to notes instead of re-explaining concepts.

```md
---
title: Measure Decode Speed on Your GPU
summary: Time prefill and decode for a small model and compare with the bandwidth estimate.
topic: foundations
requires: [prefill, decode]
level: beginner
time: 1–2 hours
---

**Goal:** check the [[decode|decode]] estimate against a real measurement.

## 1. Set up
...

## 2. Time prefill
...
```

---

## Adding a path

A path is an ordered reading list. Create `src/content/paths/why-decode-is-slow.yaml`:

```yaml
title: Why Decode Is Slow
summary: From one forward pass to a tokens-per-second estimate.
steps:
  - prefill
  - decode
  - weight-memory
  - measure-decode-speed
```

Each step is the id of a note, widget or project, and one entry can sit on many paths. The path page shows which steps the reader has visited. The first two paths also become buttons on the home page.

---

## Before you commit

```bash
npm run build
```

The build fails if anything is wrong. Common messages:

| Error | Fix |
|---|---|
| `Broken wiki link [[x]] in ...` | No entry has the id `x`. Check the spelling, or create the file. |
| `"a" requires unknown id "x"` (or `is related to`, `links to`) | Same: fix the id in `requires`, `related` or the `[[link]]`. |
| `Duplicate id "x"` | Two files share a name across notes, widgets and projects. Rename one. |
| `"a" has unknown topic "x"` | The `topic` isn't in `src/data/topics.ts`. Add it there or fix the spelling. |
| `does not match collection schema` … `summary: Required` | A required frontmatter field (`title`, `summary`, `topic`) is missing. |
| `Path "p" has a step "x" that doesn't match ...` | A path step points to an entry that doesn't exist. |

`npx astro check` also type-checks widgets and pages.

---

## Deploying

```bash
npx wrangler login   # once
npm run deploy
```

This builds the site and uploads it to the `prefill-learn` Worker, which serves **learn.prefill.here** (set in `wrangler.jsonc` under `routes`).

- The `prefill.here` zone must be on the Cloudflare account that `npx wrangler whoami` shows.
- On the first deploy, Cloudflare creates the DNS record and TLS certificate for `learn.prefill.here`. Don't add a DNS record by hand, since an existing record on that name blocks the custom domain.
- The site is only served on the custom domain: `workers_dev` and preview URLs are off.
- Static pages need no Cloudflare resources, so "No bindings found" is expected.
- To check a deploy without uploading: `npm run build && npx wrangler deploy --dry-run`.

The domain also lives in `astro.config.mjs` (`site`), which is used for canonical and Open Graph URLs. If the domain changes, update both files.

---

## Where things live

```
src/
  content/
    notes/       one idea per file (.md / .mdx)
    widgets/     a page per widget (.mdx)
    projects/    long build guides (.md / .mdx)
    paths/       reading routes (.yaml)
  data/
    topics.ts    chapters of the numbered index
    hardware.ts  GPU specs, shared by all widgets
    models.ts    model configs, shared by all widgets
  lib/
    inference.ts formulas used by widgets
    graph.ts     builds links, backlinks, the index and the graph
    remark-wikilinks.mjs  turns [[id]] into links and fails on broken ones
    sprites.ts   pixel icons as ASCII grids
  components/
    widgets/     widget components + widget.css
  styles/
    nullfuse.css design tokens and pixel primitives
    global.css   site layout and typography
```

---

## Design

The layout follows Algebrica: a top bar with a menu drawer, a centered hero, a numbered "Knowledge base" index, and articles that end with their chapter's index. The look is nullfuse/ui, ported to plain CSS in `src/styles/nullfuse.css`:

- Black and white tokens. Sun (yellow) is only for highlights, danger only for errors. No raw hex values.
- Notched pixel borders (`nf-pixel`, `nf-pixel-flat`, `nf-pixel-inset`). No border-radius and no blurred shadows.
- EB Garamond for headings only (hero, page titles, article `##`), after Algebrica. This is Prefill's one departure from nullfuse. Geist for everything else, Geist Mono for labels. Never a pixel font.
- Sprite icons from ASCII grids in `src/lib/sprites.ts`, rendered by `PixelIcon.astro`.
- Motion uses `steps()` only, and reduced-motion settings are respected.

## License

- **Writing** (everything in `src/content/`) is [CC BY 4.0](LICENSE-CONTENT). Anyone can reuse it, even commercially, as long as they credit Prefill.
- **Code** (everything else) is [MIT](LICENSE).

By opening a pull request, you agree your contribution is released under the same licenses.

## Adding server features later

Every page is prerendered. For comments, feedback or search, add a route with `export const prerender = false`, plus the binding it needs (D1, KV) in `wrangler.jsonc`.
