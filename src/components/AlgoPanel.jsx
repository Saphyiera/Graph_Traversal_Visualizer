import GridCanvas, { ALGO_THEME } from './GridCanvas';
import styles from './AlgoPanel.module.css';

const ALGO_DESCRIPTIONS = {
  bfs:  'Guarantees shortest path. Explores all neighbors at each depth before going deeper.',
  dfs:  'Explores as far as possible before backtracking. Not guaranteed to find shortest path.',
  'a*': 'Heuristic-guided. Uses Manhattan distance to prioritize promising paths.',
  ids:  'Combines DFS memory efficiency with BFS optimality via increasing depth limits.',
  dijkstra: 'Uniformly expands lowest-cost nodes first. Guarantees optimal shortest path with non-negative costs.',
  'bellman-ford': 'Relaxes all edges repeatedly. Handles negative weights in general graphs and detects unreachable goals.',
  ucs: 'Uniform cost search. Equivalent to Dijkstra on equal non-negative edge weights.',
  'bidirectional-bfs': 'Runs BFS simultaneously from start and end to reduce search depth before the frontiers meet.',
  'greedy-best-first': 'Chooses nodes closest to the goal by heuristic only. Fast but not guaranteed optimal.',
  'beam-search': 'Keeps only top-k heuristic candidates per layer. Faster and memory bounded, but may miss valid shortest paths.',
  'ida*': 'Iterative deepening A*. Uses f-cost thresholds to combine A* guidance with low memory usage.',
  rbfs: 'Recursive best-first search. Best-first behavior with depth-first memory footprint.',
  'jump-point-search': 'Prunes symmetric expansions on grids by jumping to forced turning points.',
  'contraction-hierarchies': 'Hierarchy-guided routing using ordered node expansion and shortcut-friendly traversal.',
};

export default function AlgoPanel({
  algo,
  grid,
  gridVersion,
  visualState,
  stats,
  hasSteps,
  panelPlaying,
  onPanelPlay,
  onPanelPause,
  onPanelStep,
  onPanelReset,
  onCellDown,
  onCellMove,
  onMouseUp,
  onMouseLeave,
}) {
  const theme  = ALGO_THEME[algo] || ALGO_THEME.bfs;
  const hasRun = stats.visited > 0;

  return (
    <div className={styles.panel} style={{ '--algo-accent': theme.accent, '--algo-dim': theme.dim }}>
      {/* Top accent bar */}
      <div className={styles.accentBar} style={{ background: theme.accent }} />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.label}>{theme.label}</span>
          {hasRun && (
            <span className={styles.badge} style={{ color: theme.bright, borderColor: `${theme.accent}55` }}>
              {stats.cost === 'No path' ? 'NO PATH' : `COST ${stats.cost}`}
            </span>
          )}
        </div>
        <p className={styles.desc}>{ALGO_DESCRIPTIONS[algo]}</p>
      </div>

      {/* Canvas */}
      <div className={styles.canvasWrap}>
        <GridCanvas
          algo={algo}
          grid={grid}
          gridVersion={gridVersion}
          visualState={visualState}
          onCellDown={onCellDown}
          onCellMove={onCellMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        />
        {/* Corner decorations */}
        <span className={`${styles.corner} ${styles.cornerTL}`} style={{ borderColor: theme.accent }} />
        <span className={`${styles.corner} ${styles.cornerTR}`} style={{ borderColor: theme.accent }} />
        <span className={`${styles.corner} ${styles.cornerBL}`} style={{ borderColor: theme.accent }} />
        <span className={`${styles.corner} ${styles.cornerBR}`} style={{ borderColor: theme.accent }} />
      </div>

      {/* Per-panel playback controls */}
      <div className={styles.playbackBar}>
        <button
          className={`${styles.pbBtn} ${panelPlaying ? styles.pbBtnActive : ''}`}
          style={panelPlaying ? { color: theme.bright, borderColor: `${theme.accent}44` } : {}}
          onClick={panelPlaying ? onPanelPause : onPanelPlay}
          disabled={!hasSteps}
          title={panelPlaying ? 'Pause' : 'Play'}
        >
          {panelPlaying ? 'PAUSE' : 'PLAY'}
        </button>
        <button
          className={styles.pbBtn}
          onClick={onPanelStep}
          disabled={!hasSteps || panelPlaying}
          title="Step"
        >
          STEP
        </button>
        <button
          className={styles.pbBtn}
          onClick={onPanelReset}
          disabled={!hasSteps}
          title="Sync to global"
        >
          SYNC
        </button>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <Stat label="VISITED" value={hasRun ? stats.visited : '—'} color={theme.bright} />
        <Stat label="PATH LEN" value={hasRun ? (stats.length || '—') : '—'} color={theme.bright} />
        <Stat label="COST" value={hasRun ? stats.cost : '—'} color={theme.bright} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue} style={{ color }}>{value}</span>
    </div>
  );
}
