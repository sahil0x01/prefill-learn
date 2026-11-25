import type { APIRoute } from 'astro';
import { getGraph } from '../lib/graph';

// Prerendered at build: id -> data for hover previews.
export const GET: APIRoute = async () => {
  const { nodes } = await getGraph();
  const out = Object.fromEntries(
    [...nodes.values()].map((n) => [n.id, { title: n.title, summary: n.summary, kind: n.kind }]),
  );
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
};
