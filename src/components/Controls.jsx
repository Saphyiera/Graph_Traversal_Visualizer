import styles from './Controls.module.css';

export default function Controls({
  gridSize,
  drawMode,
  selectedAlgos,
  animating,
  hasSteps,
  speed,
  beamK,
  algoPickerOpen,
  onResize,
  onDrawModeChange,
  onToggleAlgoPicker,
  onAutoGenerate,
  onGenerateMaze,
  onClear,
  onVisualize,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
  onBeamKChange,
}) {
  const sizeOptions = [10, 20, 30, 40, 50];

  return (
    <div className={styles.bar}>
      <ControlGroup label="GRID SIZE">
        <div className={styles.sizeButtons}>
          {sizeOptions.map(s => (
            <button
              key={s}
              className={`${styles.sizeBtn} ${gridSize === s ? styles.sizeBtnActive : ''}`}
              onClick={() => onResize(s)}
            >
              {s}²
            </button>
          ))}
          <input
            type="number"
            className={styles.sizeInput}
            defaultValue={gridSize}
            min={10}
            max={100}
            placeholder="?"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const v = parseInt(e.target.value, 10);
                if (v >= 10 && v <= 100) onResize(v);
              }
            }}
            onBlur={e => {
              const v = parseInt(e.target.value, 10);
              if (v >= 10 && v <= 100) onResize(v);
            }}
          />
        </div>
      </ControlGroup>

      <Divider />

      <ControlGroup label="DRAW MODE">
        <div className={styles.modeButtons}>
          {[
            { id: 'wall', label: 'WALL', icon: '▪' },
            { id: 'start', label: 'START', icon: '◉', color: '#f43f5e' },
            { id: 'end', label: 'END', icon: '◈', color: '#22c55e' },
          ].map(m => (
            <button
              key={m.id}
              className={`${styles.modeBtn} ${drawMode === m.id ? styles.modeBtnActive : ''}`}
              onClick={() => onDrawModeChange(m.id)}
              style={drawMode === m.id && m.color ? { borderColor: m.color, color: m.color } : {}}
            >
              <span className={styles.modeIcon}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </ControlGroup>

      <Divider />

      <ControlGroup label="ALGORITHMS">
        <button
          className={`${styles.btn} ${styles.algoPickerBtn}`}
          onClick={onToggleAlgoPicker}
        >
          {algoPickerOpen ? 'CLOSE ALGORITHMS' : `CHOOSE ALGORITHMS (${selectedAlgos.length})`}
        </button>
      </ControlGroup>

      <Divider />

      <ControlGroup label="SEARCH TUNING">
        <div className={styles.tuningRow}>
          <span className={styles.tuningLabel}>BEAM k</span>
          <input
            type="number"
            className={styles.kInput}
            min={1}
            max={20}
            value={beamK}
            onChange={e => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) onBeamKChange(Math.max(1, Math.min(20, Math.floor(v))));
            }}
          />
        </div>
      </ControlGroup>

      <Divider />

      <ControlGroup label="OBSTACLES">
        <div className={styles.row}>
          <button className={styles.btn} onClick={onAutoGenerate}>AUTO</button>
          <button className={styles.btn} onClick={onGenerateMaze}>MAZE</button>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onClear}>CLEAR</button>
        </div>
      </ControlGroup>

      <Divider />

      <ControlGroup label="RUN">
        <button
          className={styles.btnVisualize}
          onClick={onVisualize}
          disabled={selectedAlgos.length === 0}
        >
          RUN
        </button>
      </ControlGroup>

      <Divider />

      <ControlGroup label="PLAYBACK">
        <div className={styles.playback}>
          <div className={styles.row}>
            <button
              className={`${styles.btn} ${animating ? styles.btnPause : ''}`}
              onClick={animating ? onPause : onPlay}
              disabled={!hasSteps}
            >
              {animating ? 'PAUSE' : 'PLAY'}
            </button>
            <button className={styles.btn} onClick={onStep} disabled={!hasSteps || animating}>STEP</button>
            <button className={styles.btn} onClick={onReset} disabled={!hasSteps}>RESET</button>
          </div>

          <div className={styles.speedRow}>
            <span className={styles.speedLabel}>SLOW</span>
            <input
              type="range"
              className={styles.slider}
              min={5}
              max={200}
              value={speed}
              onChange={e => onSpeedChange(Number(e.target.value))}
            />
            <span className={styles.speedLabel}>FAST</span>
          </div>
        </div>
      </ControlGroup>
    </div>
  );
}

function ControlGroup({ label, children }) {
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel}>{label}</span>
      {children}
    </div>
  );
}

function Divider() {
  return <div className={styles.divider} />;
}
