"use client";

import { useRef, useEffect, useMemo, useCallback, useReducer } from "react";

const NODES = [
  // Left — foundations
  { cx: 55,  cy: 148, r: 7,  color: "var(--bloom-remember)", delay: 0 },
  { cx: 145, cy: 82,  r: 6,  color: "var(--bloom-remember)", delay: 0.1 },
  { cx: 130, cy: 188, r: 8,  color: "var(--bloom-understand)", delay: 0.22 },
  // Middle — rising
  { cx: 245, cy: 62,  r: 7,  color: "var(--bloom-understand)", delay: 0.36 },
  { cx: 290, cy: 150, r: 10, color: "var(--bloom-apply)", delay: 0.5 },
  // Peak
  { cx: 360, cy: 52,  r: 8,  color: "var(--bloom-apply)", delay: 0.62 },
  { cx: 428, cy: 38,  r: 11, color: "var(--bloom-analyze)", delay: 0.78 },
  // Tassel
  { cx: 468, cy: 128, r: 8,  color: "var(--bloom-evaluate)", delay: 0.92 },
  { cx: 498, cy: 222, r: 12, color: "var(--bloom-create)", delay: 1.1 },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2],
  [1, 3], [2, 4],
  [1, 4],
  [3, 5], [4, 5],
  [5, 6],
  [6, 7], [7, 8],
];

export function SkillGraphVisual() {
  const svgRef = useRef<SVGSVGElement>(null);
  const pos = useRef(NODES.map(n => ({ x: n.cx, y: n.cy })));
  const vel = useRef(NODES.map(() => ({ vx: 0, vy: 0 })));
  const dragIdx = useRef<number | null>(null);
  const anim = useRef(0);
  const [, rerender] = useReducer((x: number) => x + 1, 0);

  const adj = useMemo(() => {
    const a: number[][] = NODES.map(() => []);
    EDGES.forEach(([f, t]) => { a[f].push(t); a[t].push(f); });
    return a;
  }, []);

  const toSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const s = pt.matrixTransform(ctm.inverse());
    return { x: s.x, y: s.y };
  }, []);

  const springBack = useCallback(() => {
    const p = pos.current;
    const v = vel.current;
    let settled = true;

    for (let i = 0; i < NODES.length; i++) {
      const dx = NODES[i].cx - p[i].x;
      const dy = NODES[i].cy - p[i].y;

      v[i].vx = (v[i].vx + dx * 0.08) * 0.7;
      v[i].vy = (v[i].vy + dy * 0.08) * 0.7;

      if (Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4 &&
          Math.abs(v[i].vx) < 0.2 && Math.abs(v[i].vy) < 0.2) {
        v[i].vx = 0;
        v[i].vy = 0;
        p[i].x = NODES[i].cx;
        p[i].y = NODES[i].cy;
      } else {
        settled = false;
        p[i].x += v[i].vx;
        p[i].y += v[i].vy;
      }
    }

    rerender();
    if (!settled) {
      anim.current = requestAnimationFrame(springBack);
    } else {
      anim.current = 0;
    }
  }, []);

  const onDown = useCallback((i: number, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as SVGElement).setPointerCapture(e.pointerId);
    dragIdx.current = i;
    if (anim.current) {
      cancelAnimationFrame(anim.current);
      anim.current = 0;
    }
    vel.current = NODES.map(() => ({ vx: 0, vy: 0 }));
  }, []);

  const onMove = useCallback((e: React.PointerEvent) => {
    const di = dragIdx.current;
    if (di === null) return;

    const { x, y } = toSvg(e.clientX, e.clientY);
    const p = pos.current;
    p[di] = { x, y };

    // Pull connected nodes via BFS — displacement from dragged node's origin
    const dragDx = x - NODES[di].cx;
    const dragDy = y - NODES[di].cy;
    const visited = new Set([di]);
    let frontier = [di];
    let depth = 1;

    while (frontier.length > 0 && depth <= 3) {
      const next: number[] = [];
      for (const node of frontier) {
        for (const nb of adj[node]) {
          if (!visited.has(nb)) {
            visited.add(nb);
            next.push(nb);
            const pull = 0.25 / depth;
            p[nb] = {
              x: NODES[nb].cx + dragDx * pull,
              y: NODES[nb].cy + dragDy * pull,
            };
          }
        }
      }
      frontier = next;
      depth++;
    }

    rerender();
  }, [toSvg, adj]);

  const onUp = useCallback(() => {
    dragIdx.current = null;
    anim.current = requestAnimationFrame(springBack);
  }, [springBack]);

  useEffect(() => {
    return () => { if (anim.current) cancelAnimationFrame(anim.current); };
  }, []);

  const p = pos.current;

  return (
    <svg
      ref={svgRef}
      viewBox="10 0 580 270"
      className="landing-graph w-full max-w-xl mx-auto"
      fill="none"
      aria-hidden="true"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      style={{ touchAction: "none" }}
    >
      {EDGES.map(([from, to], i) => (
        <line
          key={`e-${i}`}
          x1={p[from].x}
          y1={p[from].y}
          x2={p[to].x}
          y2={p[to].y}
          stroke="var(--text-tertiary)"
          strokeWidth="1"
          className="graph-edge"
          style={{ animationDelay: `${Math.max(NODES[from].delay, NODES[to].delay) + 0.15}s` }}
        />
      ))}
      {NODES.map((n, i) => (
        <g
          key={`n-${i}`}
          className="graph-node"
          style={{ animationDelay: `${n.delay}s` }}
          onPointerDown={(e) => onDown(i, e)}
        >
          <circle cx={p[i].x} cy={p[i].y} r={n.r * 2.5} fill={n.color} opacity="0.12" />
          <circle cx={p[i].x} cy={p[i].y} r={n.r} fill={n.color} />
        </g>
      ))}
    </svg>
  );
}
