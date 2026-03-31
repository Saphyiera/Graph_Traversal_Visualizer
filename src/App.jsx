import { useState, useRef, useCallback, useEffect } from 'react';
import { Grid } from './lib/grid';
import { runAlgorithm } from './lib/algorithms';
import { ALGO_OPTIONS } from './lib/algorithmOptions';
import Controls from './components/Controls';
import AlgoPanel from './components/AlgoPanel';
import { ALGO_THEME } from './components/GridCanvas';
import styles from './App.module.css';

const EMPTY_VS = { visited: [], frontier: [], path: [], current: null };

function speedToDelay(speed) {
  return Math.max(5, Math.round(300 - speed * 1.47));
}

export default function App() {
  const gridRef = useRef(new Grid(30));
  const [gridSize, setGridSize] = useState(30);
  const [gridVersion, setGridVersion] = useState(0);

  const [drawMode, setDrawMode] = useState('wall');
  const [selectedAlgos, setSelectedAlgos] = useState(['bfs', 'dfs', 'a*', 'ids']);
  const [algoPickerOpen, setAlgoPickerOpen] = useState(false);
  const [beamK, setBeamK] = useState(3);

  const isDrawingRef = useRef(false);
  const wallActionRef = useRef('place');

  const [animState, setAnimState] = useState({
    steps: {},
    currentStep: 0,
    maxSteps: 0,
    isPlaying: false,
  });
  const [speed, setSpeed] = useState(60);

  // Per-panel independent playback: { [algo]: { currentStep, isPlaying } }
  const [panelPlayback, setPanelPlayback] = useState({});

  const bumpGrid = useCallback(() => setGridVersion(v => v + 1), []);

  useEffect(() => {
    if (!animState.isPlaying || animState.maxSteps === 0) return;

    const id = setInterval(() => {
      setAnimState(s => {
        if (!s.isPlaying) return s;
        const next = s.currentStep + 1;
        if (next >= s.maxSteps) {
          return { ...s, currentStep: s.maxSteps, isPlaying: false };
        }
        return { ...s, currentStep: next };
      });
    }, speedToDelay(speed));

    return () => clearInterval(id);
  }, [animState.isPlaying, speed]);

  // Per-panel playback timers
  useEffect(() => {
    const playing = Object.entries(panelPlayback).filter(([, p]) => p.isPlaying);
    if (playing.length === 0) return;

    const id = setInterval(() => {
      setPanelPlayback(prev => {
        const next = { ...prev };
        let changed = false;
        for (const [algo, p] of Object.entries(next)) {
          if (!p.isPlaying) continue;
          const steps = animState.steps[algo];
          const max = steps ? steps.length : 0;
          const ns = p.currentStep + 1;
          if (ns >= max) {
            next[algo] = { ...p, currentStep: max, isPlaying: false };
          } else {
            next[algo] = { ...p, currentStep: ns };
          }
          changed = true;
        }
        return changed ? next : prev;
      });
    }, speedToDelay(speed));

    return () => clearInterval(id);
  }, [panelPlayback, speed, animState.steps]);

  const handleResize = useCallback((size) => {
    gridRef.current.resize(size);
    setGridSize(size);
    setAnimState({ steps: {}, currentStep: 0, maxSteps: 0, isPlaying: false });
    setPanelPlayback({});
    bumpGrid();
  }, [bumpGrid]);

  const handleAutoGenerate = useCallback(() => {
    const g = gridRef.current;
    for (let r = 0; r < g.size; r++) {
      for (let c = 0; c < g.size; c++) {
        if ((r === g.start?.r && c === g.start?.c) || (r === g.end?.r && c === g.end?.c)) continue;
        g.setCell(r, c, Math.random() < 0.3 ? 'wall' : 'empty');
      }
    }
    bumpGrid();
  }, [bumpGrid]);

  const handleGenerateMaze = useCallback(() => {
    gridRef.current.generateMaze();
    setAnimState({ steps: {}, currentStep: 0, maxSteps: 0, isPlaying: false });
    setPanelPlayback({});
    bumpGrid();
  }, [bumpGrid]);

  const handleClear = useCallback(() => {
    gridRef.current.clear();
    setAnimState({ steps: {}, currentStep: 0, maxSteps: 0, isPlaying: false });
    setPanelPlayback({});
    bumpGrid();
  }, [bumpGrid]);

  const handleCellDown = useCallback((r, c) => {
    isDrawingRef.current = true;
    if (drawMode === 'wall') {
      const t = gridRef.current.getCell(r, c)?.type;
      wallActionRef.current = t === 'wall' ? 'erase' : 'place';
    }
    applyDraw(r, c);
  }, [drawMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellMove = useCallback((r, c) => {
    if (!isDrawingRef.current) return;
    applyDraw(r, c);
  }, [drawMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseUp = useCallback(() => { isDrawingRef.current = false; }, []);
  const handleMouseLeave = useCallback(() => { isDrawingRef.current = false; }, []);

  function applyDraw(r, c) {
    const g = gridRef.current;
    if (drawMode === 'wall') {
      const cell = g.getCell(r, c);
      if (!cell) return;
      if (wallActionRef.current === 'place' && cell.type === 'empty') g.setCell(r, c, 'wall');
      if (wallActionRef.current === 'erase' && cell.type === 'wall') g.setCell(r, c, 'empty');
    } else if (drawMode === 'start') {
      g.setCell(r, c, 'start');
    } else if (drawMode === 'end') {
      g.setCell(r, c, 'end');
    }
    bumpGrid();
  }

  const handleVisualize = useCallback(() => {
    const g = gridRef.current;
    if (!g.isReady()) return;

    setAnimState(prev => ({ ...prev, isPlaying: false }));

    const steps = {};
    let maxSteps = 0;
    for (const algo of selectedAlgos) {
      const s = runAlgorithm(algo, g, g.start, g.end, { beamK });
      steps[algo] = s;
      maxSteps = Math.max(maxSteps, s.length);
    }
    setAnimState({ steps, currentStep: 0, maxSteps, isPlaying: false });
    setPanelPlayback({});
  }, [selectedAlgos, beamK]);

  const handlePlay = useCallback(() => {
    setPanelPlayback({});
    setAnimState(s => {
      if (s.maxSteps === 0) return s;
      const cur = s.currentStep >= s.maxSteps ? 0 : s.currentStep;
      return { ...s, currentStep: cur, isPlaying: true };
    });
  }, []);

  const handlePause = useCallback(() => {
    setAnimState(s => ({ ...s, isPlaying: false }));
  }, []);

  const handleStep = useCallback(() => {
    setPanelPlayback({});
    setAnimState(s => ({
      ...s,
      isPlaying: false,
      currentStep: Math.min(s.currentStep + 1, s.maxSteps),
    }));
  }, []);

  const handleReset = useCallback(() => {
    setPanelPlayback({});
    setAnimState(s => ({ ...s, isPlaying: false, currentStep: 0 }));
  }, []);

  // Per-panel playback handlers
  const handlePanelPlay = useCallback((algo) => {
    const steps = animState.steps[algo];
    if (!steps || steps.length === 0) return;
    setPanelPlayback(prev => {
      const cur = prev[algo]?.currentStep ?? animState.currentStep;
      const max = steps.length;
      return {
        ...prev,
        [algo]: { currentStep: cur >= max ? 0 : cur, isPlaying: true },
      };
    });
  }, [animState.steps, animState.currentStep]);

  const handlePanelPause = useCallback((algo) => {
    setPanelPlayback(prev => {
      if (!prev[algo]) return prev;
      return { ...prev, [algo]: { ...prev[algo], isPlaying: false } };
    });
  }, []);

  const handlePanelStep = useCallback((algo) => {
    const steps = animState.steps[algo];
    if (!steps || steps.length === 0) return;
    setPanelPlayback(prev => {
      const cur = prev[algo]?.currentStep ?? animState.currentStep;
      return {
        ...prev,
        [algo]: { currentStep: Math.min(cur + 1, steps.length), isPlaying: false },
      };
    });
  }, [animState.steps, animState.currentStep]);

  const handlePanelReset = useCallback((algo) => {
    setPanelPlayback(prev => {
      const { [algo]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleAlgoToggle = useCallback((algo) => {
    setSelectedAlgos(prev =>
      prev.includes(algo) ? prev.filter(a => a !== algo) : [...prev, algo]
    );
  }, []);

  const getVisualState = useCallback((algo) => {
    const { steps, currentStep: globalStep } = animState;
    const s = steps[algo];
    if (!s || s.length === 0) return EMPTY_VS;
    const step = panelPlayback[algo]?.currentStep ?? globalStep;
    if (step === 0) return EMPTY_VS;
    return s[Math.min(step, s.length) - 1] || EMPTY_VS;
  }, [animState, panelPlayback]);

  const getStats = useCallback((algo) => {
    const s = animState.steps[algo];
    if (!s || s.length === 0) return { visited: 0, length: 0, cost: '-' };
    const last = s[s.length - 1];
    return {
      visited: last.visited.length,
      length: last.path.length,
      cost: last.path.length > 0 ? last.path.length - 1 : 'No path',
    };
  }, [animState.steps]);

  const [notReady, setNotReady] = useState(false);
  const handleVisualizeWithCheck = useCallback(() => {
    if (!gridRef.current.isReady()) {
      setNotReady(true);
      setTimeout(() => setNotReady(false), 2000);
      return;
    }
    handleVisualize();
  }, [handleVisualize]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <div>
            <h1 className={styles.title}>PATHFINDER</h1>
            <p className={styles.subtitle}>Graph Traversal Algorithm Visualizer</p>
          </div>
        </div>

        <div className={styles.legend}>
          {[
            { color: '#f43f5e', label: 'Start' },
            { color: '#22c55e', label: 'End' },
            { color: '#e8edf2', label: 'Wall' },
            { color: '#1a3a55', label: 'Visited' },
            { color: '#38bdf8', label: 'Path' },
            { color: '#facc15', label: 'Current' },
          ].map(({ color, label }) => (
            <div key={label} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </header>

      <Controls
        gridSize={gridSize}
        drawMode={drawMode}
        selectedAlgos={selectedAlgos}
        animating={animState.isPlaying}
        hasSteps={animState.maxSteps > 0}
        speed={speed}
        beamK={beamK}
        algoPickerOpen={algoPickerOpen}
        onResize={handleResize}
        onDrawModeChange={setDrawMode}
        onToggleAlgoPicker={() => setAlgoPickerOpen(v => !v)}
        onAutoGenerate={handleAutoGenerate}
        onGenerateMaze={handleGenerateMaze}
        onClear={handleClear}
        onVisualize={handleVisualizeWithCheck}
        onPlay={handlePlay}
        onPause={handlePause}
        onStep={handleStep}
        onReset={handleReset}
        onSpeedChange={setSpeed}
        onBeamKChange={setBeamK}
      />

      {algoPickerOpen && (
        <section className={styles.algoChooser}>
          <div className={styles.algoChooserHeader}>Select Algorithms</div>
          <div className={styles.algoChecklist}>
            {ALGO_OPTIONS.map(({ id, name }) => {
              const on = selectedAlgos.includes(id);
              const theme = ALGO_THEME[id] || ALGO_THEME.bfs;
              return (
                <label key={id} className={`${styles.algoItem} ${on ? styles.algoItemActive : ''}`}>
                  <input
                    className={styles.algoCheck}
                    type="checkbox"
                    checked={on}
                    onChange={() => handleAlgoToggle(id)}
                  />
                  <span className={styles.algoDot} style={{ backgroundColor: theme.accent }} />
                  <span className={styles.algoName}>{name}</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {notReady && (
        <div className={styles.toast}>
          Place a <strong>start</strong> (red) and <strong>end</strong> (green) point first
        </div>
      )}

      {selectedAlgos.length === 0 ? (
        <div className={styles.empty}>
          <span>Select at least one algorithm above</span>
        </div>
      ) : (
        <main className={styles.panels}>
          {selectedAlgos.map(algo => (
            <div key={algo} className={styles.panelWrapper}>
              <AlgoPanel
                algo={algo}
                grid={gridRef.current}
                gridVersion={gridVersion}
                visualState={getVisualState(algo)}
                stats={getStats(algo)}
                hasSteps={!!animState.steps[algo] && animState.steps[algo].length > 0}
                panelPlaying={!!panelPlayback[algo]?.isPlaying}
                onPanelPlay={() => handlePanelPlay(algo)}
                onPanelPause={() => handlePanelPause(algo)}
                onPanelStep={() => handlePanelStep(algo)}
                onPanelReset={() => handlePanelReset(algo)}
                onCellDown={handleCellDown}
                onCellMove={handleCellMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              />
            </div>
          ))}
        </main>
      )}
    </div>
  );
}
