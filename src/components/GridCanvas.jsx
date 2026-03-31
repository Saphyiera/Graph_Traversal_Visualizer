import { useRef, useEffect, useCallback } from 'react';

export const ALGO_THEME = {
  bfs: {
    label: 'BFS',
    accent: '#0ea5e9',
    dim: '#052033',
    mid: '#0369a1',
    bright: '#38bdf8',
    glow: '#7dd3fc',
    visited: '#073350',
    frontier: '#0284c7',
  },
  dfs: {
    label: 'DFS',
    accent: '#8b5cf6',
    dim: '#1a0a3d',
    mid: '#6d28d9',
    bright: '#a78bfa',
    glow: '#c4b5fd',
    visited: '#2d1254',
    frontier: '#7c3aed',
  },
  'a*': {
    label: 'A*',
    accent: '#f97316',
    dim: '#2d0f00',
    mid: '#c2410c',
    bright: '#fb923c',
    glow: '#fdba74',
    visited: '#431407',
    frontier: '#ea580c',
  },
  ids: {
    label: 'IDS',
    accent: '#22c55e',
    dim: '#021810',
    mid: '#15803d',
    bright: '#4ade80',
    glow: '#86efac',
    visited: '#052e16',
    frontier: '#16a34a',
  },
  dijkstra: {
    label: 'DIJKSTRA',
    accent: '#14b8a6',
    dim: '#022222',
    mid: '#0f766e',
    bright: '#2dd4bf',
    glow: '#5eead4',
    visited: '#042f2e',
    frontier: '#0d9488',
  },
  'bellman-ford': {
    label: 'BELLMAN-FORD',
    accent: '#ef4444',
    dim: '#2e0a0a',
    mid: '#b91c1c',
    bright: '#f87171',
    glow: '#fca5a5',
    visited: '#3f1010',
    frontier: '#dc2626',
  },
  ucs: {
    label: 'UCS',
    accent: '#06b6d4',
    dim: '#01232b',
    mid: '#0e7490',
    bright: '#22d3ee',
    glow: '#67e8f9',
    visited: '#083344',
    frontier: '#0891b2',
  },
  'bidirectional-bfs': {
    label: 'BIDIR BFS',
    accent: '#84cc16',
    dim: '#1b2a04',
    mid: '#65a30d',
    bright: '#a3e635',
    glow: '#bef264',
    visited: '#293d09',
    frontier: '#65a30d',
  },
  'greedy-best-first': {
    label: 'GREEDY',
    accent: '#f59e0b',
    dim: '#2b1802',
    mid: '#b45309',
    bright: '#fbbf24',
    glow: '#fcd34d',
    visited: '#422006',
    frontier: '#d97706',
  },
  'beam-search': {
    label: 'BEAM',
    accent: '#6366f1',
    dim: '#0f1235',
    mid: '#4338ca',
    bright: '#818cf8',
    glow: '#a5b4fc',
    visited: '#1e1b4b',
    frontier: '#4f46e5',
  },
  'ida*': {
    label: 'IDA*',
    accent: '#10b981',
    dim: '#03271f',
    mid: '#047857',
    bright: '#34d399',
    glow: '#6ee7b7',
    visited: '#064e3b',
    frontier: '#059669',
  },
  rbfs: {
    label: 'RBFS',
    accent: '#e11d48',
    dim: '#2f0716',
    mid: '#be123c',
    bright: '#fb7185',
    glow: '#fda4af',
    visited: '#4c0519',
    frontier: '#e11d48',
  },
  'jump-point-search': {
    label: 'JPS',
    accent: '#0ea5a4',
    dim: '#022f2f',
    mid: '#0f766e',
    bright: '#5eead4',
    glow: '#99f6e4',
    visited: '#134e4a',
    frontier: '#14b8a6',
  },
  'contraction-hierarchies': {
    label: 'CH',
    accent: '#a855f7',
    dim: '#24083d',
    mid: '#7e22ce',
    bright: '#c084fc',
    glow: '#d8b4fe',
    visited: '#3b0764',
    frontier: '#9333ea',
  },
};

export default function GridCanvas({
  algo,
  grid,
  gridVersion,
  visualState,
  onCellDown,
  onCellMove,
  onMouseUp,
  onMouseLeave,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const sz = grid.size;
    const cw = W / sz;
    const ch = H / sz;
    const th = ALGO_THEME[algo] || ALGO_THEME.bfs;
    const vs = visualState || { visited: [], frontier: [], path: [], current: null };
    const pad = cw > 5 ? 1 : 0;

    const visitedSet = new Set(vs.visited.map(c => `${c.r},${c.c}`));
    const frontierSet = new Set(vs.frontier.map(c => `${c.r},${c.c}`));
    const pathSet = new Set(vs.path.map(c => `${c.r},${c.c}`));
    const currentKey = vs.current ? `${vs.current.r},${vs.current.c}` : null;

    ctx.fillStyle = '#040c18';
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < sz; r++) {
      for (let c = 0; c < sz; c++) {
        const type = grid.cells[r][c].type;
        const key = `${r},${c}`;
        const x = c * cw + pad;
        const y = r * ch + pad;
        const w = cw - pad * 2;
        const h = ch - pad * 2;

        if (type === 'start' || type === 'end') continue;

        let color = '#0a1220';
        if (type === 'wall') {
          color = '#e8edf2';
        } else {
          if (pathSet.has(key)) color = th.bright;
          else if (key === currentKey) color = '#facc15';
          else if (frontierSet.has(key)) color = th.frontier;
          else if (visitedSet.has(key)) color = th.visited;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
      }
    }

    if (vs.path.length > 0) {
      ctx.save();
      ctx.shadowColor = th.glow;
      ctx.shadowBlur = Math.max(6, cw * 1.2);
      ctx.fillStyle = th.bright;
      for (const { r, c } of vs.path) {
        const type = grid.cells[r][c].type;
        if (type === 'start' || type === 'end') continue;
        ctx.fillRect(c * cw + pad, r * ch + pad, cw - pad * 2, ch - pad * 2);
      }
      ctx.restore();
    }

    if (vs.current) {
      ctx.save();
      const x = vs.current.c * cw + pad;
      const y = vs.current.r * ch + pad;
      const w = cw - pad * 2;
      const h = ch - pad * 2;
      ctx.strokeStyle = '#fff4c2';
      ctx.lineWidth = Math.max(1, cw * 0.1);
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = Math.max(3, cw * 0.8);
      ctx.strokeRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2));
      ctx.restore();
    }

    const drawMarker = (row, col, fill, glow, shape) => {
      const cx = col * cw + cw / 2;
      const cy = row * ch + ch / 2;
      const radius = Math.max(2, cw * 0.38);
      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur = radius * 2.5;
      ctx.fillStyle = fill;
      ctx.beginPath();
      if (shape === 'diamond') {
        ctx.moveTo(cx, cy - radius);
        ctx.lineTo(cx + radius, cy);
        ctx.lineTo(cx, cy + radius);
        ctx.lineTo(cx - radius, cy);
        ctx.closePath();
      } else {
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = Math.max(0.5, cw * 0.05);
      ctx.stroke();
      ctx.restore();
    };

    if (grid.start) drawMarker(grid.start.r, grid.start.c, '#f43f5e', '#ff6b8a', 'circle');
    if (grid.end) drawMarker(grid.end.r, grid.end.c, '#22c55e', '#4ade80', 'diamond');
  }, [algo, grid, gridVersion, visualState]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver(() => {
      const { width } = container.getBoundingClientRect();
      const side = Math.floor(width);
      if (side <= 0) return;
      canvas.width = side;
      canvas.height = side;
      draw();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  const getCell = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const cw = canvas.width / grid.size;
    const ch = canvas.height / grid.size;
    return {
      r: Math.max(0, Math.min(grid.size - 1, Math.floor(y / ch))),
      c: Math.max(0, Math.min(grid.size - 1, Math.floor(x / cw))),
    };
  }, [grid]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          aspectRatio: '1 / 1',
          cursor: 'crosshair',
          borderRadius: '4px',
        }}
        onMouseDown={e => { const cell = getCell(e); if (cell) onCellDown(cell.r, cell.c); }}
        onMouseMove={e => { const cell = getCell(e); if (cell) onCellMove(cell.r, cell.c); }}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      />
    </div>
  );
}
