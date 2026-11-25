import { useEffect, useRef, useState } from 'preact/hooks';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';

interface N extends SimulationNodeDatum {
  id: string;
  kind: 'notes' | 'widgets' | 'projects';
  title: string;
  url: string;
}
interface L extends SimulationLinkDatum<N> {
  type: 'requires' | 'related' | 'mentions';
}
interface Props {
  data: { nodes: N[]; edges: { source: string; target: string; type: L['type'] }[] };
}

const W = 900;
const H = 560;
const FILL = { notes: 'var(--nf-ink)', widgets: 'var(--nf-sun)', projects: 'var(--nf-surface)' };
// Snap positions to a 2px grid so everything lands on whole pixels.
const snap = (v = 0) => Math.round(v / 2) * 2;

export default function GraphView({ data }: Props) {
  const [, setTick] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const sim = useRef<ReturnType<typeof forceSimulation<N>> | undefined>(undefined);
  const nodes = useRef<N[]>(data.nodes.map((n) => ({ ...n })));
  const links = useRef<L[]>(data.edges.map((e) => ({ ...e })));
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ node: N; moved: boolean } | null>(null);

  useEffect(() => {
    const s = forceSimulation(nodes.current)
      .force('link', forceLink<N, L>(links.current).id((d) => d.id).distance(120))
      .force('charge', forceManyBody().strength(-420))
      .force('center', forceCenter(W / 2, H / 2))
      .force('collide', forceCollide(40));
    // Stepped motion: redraw every few ticks instead of every frame.
    let n = 0;
    s.on('tick', () => {
      if (n++ % 4 === 0) setTick((t) => t + 1);
    });
    s.on('end', () => setTick((t) => t + 1));
    sim.current = s;
    return () => s.stop();
  }, []);

  const toLocal = (e: PointerEvent) => {
    const pt = svg.current!.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.current!.getScreenCTM()!.inverse());
  };
  const onDown = (n: N) => (e: PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { node: n, moved: false };
    sim.current?.alphaTarget(0.3).restart();
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toLocal(e);
    d.node.fx = p.x;
    d.node.fy = p.y;
    d.moved = true;
  };
  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    sim.current?.alphaTarget(0);
    d.node.fx = d.node.fy = null;
    if (!d.moved) location.href = d.node.url;
    drag.current = null;
  };

  const near = new Set<string>();
  if (hover) {
    near.add(hover);
    for (const l of links.current) {
      const s = (l.source as N).id;
      const t = (l.target as N).id;
      if (s === hover) near.add(t);
      if (t === hover) near.add(s);
    }
  }

  return (
    <div class="nf-pixel" style={{ background: 'var(--nf-surface)', ['--nf-drop' as string]: '4px' }}>
      <svg
        ref={svg}
        viewBox={`0 0 ${W} ${H}`}
        shape-rendering="crispEdges"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          touchAction: 'none',
          fontFamily: 'var(--font-label)',
          backgroundImage:
            'linear-gradient(to right, var(--nf-border) 1px, transparent 1px), linear-gradient(to bottom, var(--nf-border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        role="img"
        aria-label="Graph of all entries and the links between them"
      >
        <defs>
          <marker id="arrow" viewBox="0 0 6 6" refX="17" refY="3" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0h2v1h1v1h1v2h-1v1h-1v1h-2z" fill="var(--nf-ink)" />
          </marker>
        </defs>
        {links.current.map((l, i) => {
          const s = l.source as N;
          const t = l.target as N;
          const lit = !hover || (near.has(s.id) && near.has(t.id));
          return (
            <line
              key={i}
              x1={snap(s.x)} y1={snap(s.y)} x2={snap(t.x)} y2={snap(t.y)}
              stroke="var(--nf-ink)"
              stroke-width={2}
              stroke-dasharray={l.type === 'requires' ? undefined : '2 4'}
              marker-end={l.type === 'requires' ? 'url(#arrow)' : undefined}
              opacity={lit ? (hover ? 1 : 0.55) : 0.1}
            />
          );
        })}
        {nodes.current.map((n) => {
          const x = snap(n.x);
          const y = snap(n.y);
          const lit = !hover || near.has(n.id);
          return (
            <g
              key={n.id}
              transform={`translate(${x},${y})`}
              style={{ cursor: 'pointer' }}
              opacity={lit ? 1 : 0.2}
              onPointerDown={onDown(n)}
              onPointerEnter={() => setHover(n.id)}
              onPointerLeave={() => setHover(null)}
            >
              <rect x={-9} y={-9} width={18} height={18} fill="var(--nf-ink)" />
              <rect x={-7} y={-7} width={14} height={14} fill={FILL[n.kind]} />
              {hover === n.id && <rect x={-13} y={-13} width={26} height={26} fill="none" stroke="var(--nf-ink)" stroke-width={2} stroke-dasharray="4 2" />}
              <text
                y={-18}
                text-anchor="middle"
                font-size={11}
                font-weight={hover === n.id ? 700 : 500}
                fill="var(--nf-fg)"
                paint-order="stroke"
                stroke="var(--nf-surface)"
                stroke-width={4}
              >
                {n.title}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
