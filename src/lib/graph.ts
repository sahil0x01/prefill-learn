import { getCollection, type CollectionEntry } from 'astro:content';
import { topics } from '../data/topics';

export const KINDS = ['notes', 'widgets', 'projects'] as const;
export type Kind = (typeof KINDS)[number];
export type Entry = CollectionEntry<Kind>;

export const KIND_LABEL: Record<Kind, string> = {
  notes: 'Note',
  widgets: 'Widget',
  projects: 'Project',
};

export interface GraphNode {
  id: string;
  kind: Kind;
  title: string;
  summary: string;
  url: string;
  tags: string[];
  topic: string;
  order?: number;
}

export type EdgeType = 'requires' | 'related' | 'mentions';
export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  entries: Map<string, Entry>;
}

const WIKI = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
let cached: Promise<Graph> | undefined;

async function build(): Promise<Graph> {
  const lists = await Promise.all(
    KINDS.map((k) => getCollection(k, ({ data }) => import.meta.env.DEV || !data.draft)),
  );
  const entries = new Map<string, Entry>();
  const nodes = new Map<string, GraphNode>();
  for (const entry of lists.flat()) {
    if (entries.has(entry.id)) throw new Error(`Duplicate id "${entry.id}"`);
    if (!topics.some((t) => t.id === entry.data.topic))
      throw new Error(
        `"${entry.id}" has unknown topic "${entry.data.topic}". Add it to src/data/topics.ts or use one of: ${topics.map((t) => t.id).join(', ')}`,
      );
    entries.set(entry.id, entry);
    nodes.set(entry.id, {
      id: entry.id,
      kind: entry.collection,
      title: entry.data.title,
      summary: entry.data.summary,
      url: `/${entry.collection}/${entry.id}/`,
      tags: entry.data.tags,
      topic: entry.data.topic,
      order: entry.data.order,
    });
  }

  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const add = (from: string, to: string, type: EdgeType, where: string) => {
    if (!nodes.has(to)) throw new Error(`"${from}" ${where} unknown id "${to}"`);
    if (from === to || seen.has(`${from}>${to}`)) return;
    seen.add(`${from}>${to}`);
    edges.push({ from, to, type });
  };
  for (const [id, entry] of entries) {
    for (const to of entry.data.requires) add(id, to, 'requires', 'requires');
    for (const to of entry.data.related) add(id, to, 'related', 'is related to');
    for (const m of (entry.body ?? '').matchAll(WIKI)) add(id, m[1].trim(), 'mentions', 'links to');
  }
  return { nodes, edges, entries };
}

export function getGraph() {
  // Cache for the whole production build; rebuild per request in dev so new
  // and edited files show up without restarting the server.
  if (import.meta.env.DEV) return build();
  cached ??= build();
  return cached;
}

/** What this entry points to, grouped by edge type. */
export async function outgoing(id: string) {
  const g = await getGraph();
  const pick = (type: EdgeType) =>
    g.edges.filter((e) => e.from === id && e.type === type).map((e) => g.nodes.get(e.to)!);
  return { requires: pick('requires'), related: pick('related') };
}

/** Entries that point to this one, of any edge type. */
export async function backlinks(id: string) {
  const g = await getGraph();
  const from = new Set(g.edges.filter((e) => e.to === id).map((e) => e.from));
  return [...from].map((f) => g.nodes.get(f)!).sort((a, b) => a.title.localeCompare(b.title));
}

export async function resolve(id: string) {
  const g = await getGraph();
  const node = g.nodes.get(id);
  if (!node) throw new Error(`Unknown id "${id}"`);
  return node;
}

export interface IndexChapter {
  number: number;
  id: string;
  title: string;
  items: (GraphNode & { number: string })[];
}

/** The numbered index: chapters in topics.ts order, entries by `order` then title. */
export async function getIndex(): Promise<IndexChapter[]> {
  const { nodes } = await getGraph();
  const all = [...nodes.values()];
  return topics
    .map((t) => ({
      id: t.id,
      title: t.title,
      items: all
        .filter((n) => n.topic === t.id)
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.title.localeCompare(b.title)),
    }))
    .filter((c) => c.items.length > 0)
    .map((c, i) => ({
      ...c,
      number: i + 1,
      items: c.items.map((n, j) => ({ ...n, number: `${i + 1}.${j + 1}` })),
    }));
}
