export class Grid {
  constructor(size = 30) {
    this.size = size;
    this.start = null;
    this.end = null;
    this._init();
  }

  _init() {
    this.cells = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => ({ type: 'empty' }))
    );
    this.setCell(0, 0, 'start');
    this.setCell(this.size - 1, this.size - 1, 'end');
  }

  resize(newSize) {
    this.size = newSize;
    this.start = null;
    this.end = null;
    this._init();
  }

  clear() {
    this.start = null;
    this.end = null;
    this._init();
  }

  isValid(r, c) {
    return r >= 0 && r < this.size && c >= 0 && c < this.size;
  }

  getCell(r, c) {
    return this.isValid(r, c) ? this.cells[r][c] : null;
  }

  setCell(r, c, type) {
    if (!this.isValid(r, c)) return;
    if (type === 'start') {
      if (this.start) this.cells[this.start.r][this.start.c].type = 'empty';
      this.start = { r, c };
    } else if (type === 'end') {
      if (this.end) this.cells[this.end.r][this.end.c].type = 'empty';
      this.end = { r, c };
    } else if (type === 'empty') {
      if (this.start?.r === r && this.start?.c === c) this.start = null;
      if (this.end?.r   === r && this.end?.c   === c) this.end   = null;
    }
    this.cells[r][c].type = type;
  }

  generateMaze() {
    this.start = null;
    this.end = null;

    this.cells = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => ({ type: 'wall' }))
    );

    const dirs = [[-2, 0], [2, 0], [0, -2], [0, 2]];
    const key = (r, c) => `${r},${c}`;
    const visited = new Set();
    const stack = [{ r: 0, c: 0 }];
    visited.add(key(0, 0));
    this.cells[0][0].type = 'empty';

    while (stack.length > 0) {
      const cur = stack[stack.length - 1];
      const shuffled = [...dirs].sort(() => Math.random() - 0.5);
      let next = null;
      for (const [dr, dc] of shuffled) {
        const nr = cur.r + dr;
        const nc = cur.c + dc;
        if (!this.isValid(nr, nc)) continue;
        if (visited.has(key(nr, nc))) continue;
        next = { r: nr, c: nc, mr: cur.r + dr / 2, mc: cur.c + dc / 2 };
        break;
      }

      if (!next) {
        stack.pop();
        continue;
      }

      this.cells[next.mr][next.mc].type = 'empty';
      this.cells[next.r][next.c].type = 'empty';
      visited.add(key(next.r, next.c));
      stack.push({ r: next.r, c: next.c });
    }

    const end = { r: this.size - 1, c: this.size - 1 };
    if (!this._hasPath({ r: 0, c: 0 }, end)) {
      this._forcePath({ r: 0, c: 0 }, end);
    }

    this.setCell(0, 0, 'start');
    this.setCell(this.size - 1, this.size - 1, 'end');
  }

  _hasPath(start, end) {
    const q = [start];
    const seen = new Set([`${start.r},${start.c}`]);
    while (q.length > 0) {
      const cur = q.shift();
      if (cur.r === end.r && cur.c === end.c) return true;
      for (const nb of this.getNeighbors(cur.r, cur.c)) {
        const k = `${nb.r},${nb.c}`;
        if (seen.has(k)) continue;
        seen.add(k);
        q.push(nb);
      }
    }
    return false;
  }

  _forcePath(start, end) {
    let r = start.r;
    let c = start.c;
    this.cells[r][c].type = 'empty';

    while (r !== end.r || c !== end.c) {
      const moveRow = r !== end.r;
      const moveCol = c !== end.c;
      const takeRow = moveRow && (!moveCol || Math.random() < 0.5);
      if (takeRow) {
        r += end.r > r ? 1 : -1;
      } else {
        c += end.c > c ? 1 : -1;
      }
      this.cells[r][c].type = 'empty';
    }
  }

  getNeighbors(r, c) {
    return [[-1,0],[1,0],[0,-1],[0,1]]
      .map(([dr,dc]) => ({ r: r + dr, c: c + dc }))
      .filter(n => this.isValid(n.r, n.c) && this.cells[n.r][n.c].type !== 'wall');
  }

  manhattan(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
  }

  isReady() { return this.start !== null && this.end !== null; }

  clone() {
    const g = new Grid(this.size);
    g.start = this.start ? { ...this.start } : null;
    g.end   = this.end   ? { ...this.end   } : null;
    for (let r = 0; r < this.size; r++)
      for (let c = 0; c < this.size; c++)
        g.cells[r][c] = { type: this.cells[r][c].type };
    return g;
  }
}
