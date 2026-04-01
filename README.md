# Random Bullshits With Claude Code
# Pathfinder — Graph Traversal Algorithm Visualizer (React)

A production-grade, visually distinctive React + Vite rewrite of the graph traversal visualizer.

## Quick Start

```bash
cd Graph_Traversal_Algo_Visualizer
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Requirements

- Node.js 18+ (download from https://nodejs.org)
- npm (included with Node.js)

## Features

- **4 algorithms side-by-side** — BFS, DFS, A*, IDS, each with its own color identity
- **Neural Forge dark theme** — deep space dark with per-algorithm neon traces
- **Configurable grid** — preset sizes (10², 20², 30², 40², 50²) or custom input
- **Draw modes** — Wall drag, Start (red circle), End (green diamond)
- **Auto-generate** — random ~30% wall density
- **Canvas rendering** — 500×500 logical pixels, DPI-scaled for any display
- **Path glow effect** — found paths render with algorithm-colored neon glow
- **Animation controls** — Play / Pause / Step / Reset + speed slider

## Algorithm Color Identity

| Algorithm | Color   | Meaning |
|-----------|---------|---------|
| BFS       | Cyan    | Level-by-level; shortest path guaranteed |
| DFS       | Violet  | Deep-first; not shortest, low memory |
| A*        | Amber   | Heuristic (Manhattan); optimal & efficient |
| IDS       | Emerald | Iterative deepening; optimal like BFS |

## Stack

- React 18 + Vite 4
- CSS Modules for component styles
- Google Fonts: Rajdhani (display), IBM Plex Mono (data), Barlow (UI)
- Canvas API for grid rendering (no DOM elements per cell)
- ResizeObserver for responsive canvas sizing
