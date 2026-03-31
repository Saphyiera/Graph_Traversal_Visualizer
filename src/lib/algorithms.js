function nodeKey(node) {
  return `${node.r},${node.c}`;
}

function keyToNode(k) {
  const [r, c] = k.split(',').map(Number);
  return { r, c };
}

function toNodes(set) {
  return Array.from(set).map(keyToNode);
}

function manhattan(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

function reconstructPath(parent, endKey) {
  if (!endKey || !parent.has(endKey)) return [];
  const path = [];
  let cur = endKey;
  while (cur != null) {
    path.unshift(keyToNode(cur));
    cur = parent.get(cur) ?? null;
  }
  return path;
}

function uniqueFrontier(frontier) {
  const seen = new Set();
  const out = [];
  for (const node of frontier) {
    const key = nodeKey(node);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ r: node.r, c: node.c });
  }
  return out;
}

function pushStep(steps, visited, frontier, path = [], current = null) {
  steps.push({
    visited: toNodes(visited),
    frontier: uniqueFrontier(frontier),
    path,
    current,
  });
}

function popBest(open) {
  let bestIdx = 0;
  for (let i = 1; i < open.length; i++) {
    if (open[i].priority < open[bestIdx].priority) bestIdx = i;
  }
  return open.splice(bestIdx, 1)[0];
}

function bfs(grid, start, end) {
  const steps = [];
  const visited = new Set();
  const parent = new Map();
  const queue = [start];
  const startKey = nodeKey(start);
  const endKey = nodeKey(end);

  visited.add(startKey);
  parent.set(startKey, null);

  while (queue.length > 0) {
    const cur = queue.shift();
    const curKey = nodeKey(cur);
    const isGoal = curKey === endKey;

    if (!isGoal) {
      for (const nb of grid.getNeighbors(cur.r, cur.c)) {
        const nbKey = nodeKey(nb);
        if (visited.has(nbKey)) continue;
        visited.add(nbKey);
        parent.set(nbKey, curKey);
        queue.push(nb);
      }
    }

    pushStep(steps, visited, queue, isGoal ? reconstructPath(parent, endKey) : [], cur);
    if (isGoal) break;
  }

  return steps;
}

function dfs(grid, start, end) {
  const steps = [];
  const visited = new Set();
  const inStack = new Set();
  const parent = new Map();
  const stack = [start];
  const startKey = nodeKey(start);
  const endKey = nodeKey(end);

  parent.set(startKey, null);
  inStack.add(startKey);

  while (stack.length > 0) {
    const cur = stack.pop();
    const curKey = nodeKey(cur);
    inStack.delete(curKey);
    if (visited.has(curKey)) continue;
    visited.add(curKey);

    const isGoal = curKey === endKey;
    if (!isGoal) {
      const neighbors = grid.getNeighbors(cur.r, cur.c);
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const nb = neighbors[i];
        const nbKey = nodeKey(nb);
        if (visited.has(nbKey) || inStack.has(nbKey)) continue;
        if (!parent.has(nbKey)) parent.set(nbKey, curKey);
        inStack.add(nbKey);
        stack.push(nb);
      }
    }

    pushStep(steps, visited, stack, isGoal ? reconstructPath(parent, endKey) : [], cur);
    if (isGoal) break;
  }

  return steps;
}

function informedSearch(grid, start, end, options = {}) {
  const { heuristicWeight = 0, greedy = false } = options;
  const steps = [];
  const visited = new Set();
  const parent = new Map();
  const gScore = new Map();
  const open = [];
  const startKey = nodeKey(start);
  const endKey = nodeKey(end);

  parent.set(startKey, null);
  gScore.set(startKey, 0);
  open.push({ node: start, priority: manhattan(start, end) * heuristicWeight });

  while (open.length > 0) {
    const { node: cur } = popBest(open);
    const curKey = nodeKey(cur);
    if (visited.has(curKey)) continue;
    visited.add(curKey);

    const isGoal = curKey === endKey;
    pushStep(steps, visited, open.map(i => i.node), isGoal ? reconstructPath(parent, endKey) : [], cur);
    if (isGoal) break;

    for (const nb of grid.getNeighbors(cur.r, cur.c)) {
      const nbKey = nodeKey(nb);
      if (visited.has(nbKey)) continue;
      const nextG = (gScore.get(curKey) ?? Infinity) + 1;
      if (nextG < (gScore.get(nbKey) ?? Infinity)) {
        gScore.set(nbKey, nextG);
        parent.set(nbKey, curKey);
        const heuristic = manhattan(nb, end) * heuristicWeight;
        const priority = greedy ? heuristic : nextG + heuristic;
        open.push({ node: nb, priority });
      }
    }
  }

  return steps;
}

function dijkstra(grid, start, end) {
  return informedSearch(grid, start, end, { heuristicWeight: 0, greedy: false });
}

function ucs(grid, start, end) {
  return informedSearch(grid, start, end, { heuristicWeight: 0, greedy: false });
}

function aStar(grid, start, end) {
  return informedSearch(grid, start, end, { heuristicWeight: 1, greedy: false });
}

function greedyBestFirst(grid, start, end) {
  return informedSearch(grid, start, end, { heuristicWeight: 1, greedy: true });
}

function ids(grid, start, end) {
  const steps = [];
  const endKey = nodeKey(end);
  let foundPath = [];

  const maxDepth = grid.size * grid.size;
  for (let limit = 0; limit <= maxDepth && foundPath.length === 0; limit++) {
    const visited = new Set();
    const parent = new Map();
    const pathSet = new Set();
    const startKey = nodeKey(start);
    parent.set(startKey, null);

    function dls(cur, depth) {
      const curKey = nodeKey(cur);
      if (depth > limit || pathSet.has(curKey) || foundPath.length > 0) return;
      pathSet.add(curKey);
      visited.add(curKey);
      pushStep(steps, visited, toNodes(pathSet), [], cur);

      if (curKey === endKey) {
        foundPath = reconstructPath(parent, endKey);
        pushStep(steps, visited, [], foundPath, cur);
        pathSet.delete(curKey);
        return;
      }

      for (const nb of grid.getNeighbors(cur.r, cur.c)) {
        const nbKey = nodeKey(nb);
        if (!parent.has(nbKey)) parent.set(nbKey, curKey);
        dls(nb, depth + 1);
      }

      pathSet.delete(curKey);
    }

    dls(start, 0);
  }

  return steps;
}

function bellmanFord(grid, start, end) {
  const steps = [];
  const parent = new Map();
  const dist = new Map();
  const visited = new Set();

  const nodes = [];
  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (grid.cells[r][c].type !== 'wall') nodes.push({ r, c });
    }
  }

  const startKey = nodeKey(start);
  const endKey = nodeKey(end);
  for (const n of nodes) dist.set(nodeKey(n), Infinity);
  dist.set(startKey, 0);
  parent.set(startKey, null);

  for (let i = 0; i < nodes.length - 1; i++) {
    let updated = false;
    const frontier = [];
    for (const u of nodes) {
      const uKey = nodeKey(u);
      const uDist = dist.get(uKey);
      if (!Number.isFinite(uDist)) continue;
      visited.add(uKey);
      for (const v of grid.getNeighbors(u.r, u.c)) {
        const vKey = nodeKey(v);
        const nd = uDist + 1;
        if (nd < (dist.get(vKey) ?? Infinity)) {
          dist.set(vKey, nd);
          parent.set(vKey, uKey);
          frontier.push(v);
          updated = true;
        }
      }
    }
    pushStep(steps, visited, frontier, [], null);
    if (!updated) break;
  }

  const path = Number.isFinite(dist.get(endKey)) ? reconstructPath(parent, endKey) : [];
  pushStep(steps, visited, [], path, path.length > 0 ? end : null);
  return steps;
}

function bidirectionalBfs(grid, start, end) {
  const steps = [];
  const startKey = nodeKey(start);
  const endKey = nodeKey(end);

  if (startKey === endKey) {
    return [{ visited: [start], frontier: [], path: [start], current: start }];
  }

  const queueA = [start];
  const queueB = [end];
  const visitedA = new Set([startKey]);
  const visitedB = new Set([endKey]);
  const parentA = new Map([[startKey, null]]);
  const parentB = new Map([[endKey, null]]);
  let meet = null;

  function expand(queue, ownVisited, otherVisited, ownParent) {
    if (queue.length === 0 || meet) return null;
    const cur = queue.shift();
    const curKey = nodeKey(cur);
    for (const nb of grid.getNeighbors(cur.r, cur.c)) {
      const nbKey = nodeKey(nb);
      if (ownVisited.has(nbKey)) continue;
      ownVisited.add(nbKey);
      ownParent.set(nbKey, curKey);
      queue.push(nb);
      if (otherVisited.has(nbKey)) {
        meet = nbKey;
        break;
      }
    }
    return cur;
  }

  function stitchPath() {
    if (!meet) return [];
    const left = reconstructPath(parentA, meet);
    const right = [];
    let cur = parentB.get(meet);
    while (cur != null) {
      right.push(keyToNode(cur));
      cur = parentB.get(cur) ?? null;
    }
    return [...left, ...right];
  }

  while (queueA.length > 0 && queueB.length > 0 && !meet) {
    const curA = expand(queueA, visitedA, visitedB, parentA);
    const curB = expand(queueB, visitedB, visitedA, parentB);
    const visited = new Set([...visitedA, ...visitedB]);
    const frontier = [...queueA, ...queueB];
    const current = curB ?? curA ?? null;
    pushStep(steps, visited, frontier, meet ? stitchPath() : [], current);
  }

  if (!meet) {
    const visited = new Set([...visitedA, ...visitedB]);
    pushStep(steps, visited, [], [], null);
  }

  return steps;
}

function beamSearch(grid, start, end, k = 3) {
  const steps = [];
  const visited = new Set();
  const parent = new Map();
  const startKey = nodeKey(start);
  const endKey = nodeKey(end);

  let frontier = [start];
  visited.add(startKey);
  parent.set(startKey, null);

  while (frontier.length > 0) {
    const nextCandidates = [];
    let goalKey = null;

    for (const cur of frontier) {
      const curKey = nodeKey(cur);
      if (curKey === endKey) {
        goalKey = curKey;
        pushStep(steps, visited, frontier, reconstructPath(parent, endKey), cur);
        return steps;
      }
      for (const nb of grid.getNeighbors(cur.r, cur.c)) {
        const nbKey = nodeKey(nb);
        if (visited.has(nbKey)) continue;
        visited.add(nbKey);
        parent.set(nbKey, curKey);
        nextCandidates.push(nb);
      }
    }

    nextCandidates.sort((a, b) => manhattan(a, end) - manhattan(b, end));
    frontier = nextCandidates.slice(0, Math.max(1, k));
    pushStep(steps, visited, frontier, goalKey ? reconstructPath(parent, goalKey) : [], frontier[0] ?? null);
  }

  pushStep(steps, visited, [], [], null);
  return steps;
}

function idaStar(grid, start, end) {
  const steps = [];
  const startKey = nodeKey(start);
  const endKey = nodeKey(end);
  const parent = new Map([[startKey, null]]);
  const visited = new Set();
  let bound = manhattan(start, end);
  let finalPath = [];

  const maxBound = grid.size * grid.size * 2;

  function search(node, g, pathSet, currentBound) {
    const f = g + manhattan(node, end);
    if (f > currentBound) return { found: false, nextBound: f };

    const curKey = nodeKey(node);
    visited.add(curKey);
    pushStep(steps, visited, toNodes(pathSet), [], node);

    if (curKey === endKey) {
      finalPath = reconstructPath(parent, endKey);
      pushStep(steps, visited, [], finalPath, node);
      return { found: true, nextBound: currentBound };
    }

    let min = Infinity;
    for (const nb of grid.getNeighbors(node.r, node.c)) {
      const nbKey = nodeKey(nb);
      if (pathSet.has(nbKey)) continue;
      parent.set(nbKey, curKey);
      pathSet.add(nbKey);
      const res = search(nb, g + 1, pathSet, currentBound);
      pathSet.delete(nbKey);
      if (res.found) return res;
      min = Math.min(min, res.nextBound);
    }
    return { found: false, nextBound: min };
  }

  while (bound <= maxBound) {
    const pathSet = new Set([startKey]);
    const res = search(start, 0, pathSet, bound);
    if (res.found) return steps;
    if (!Number.isFinite(res.nextBound)) break;
    bound = res.nextBound;
  }

  if (finalPath.length === 0) pushStep(steps, visited, [], [], null);
  return steps;
}

function rbfs(grid, start, end) {
  const steps = [];
  const visited = new Set();
  const parent = new Map([[nodeKey(start), null]]);
  const gScore = new Map([[nodeKey(start), 0]]);
  const endKey = nodeKey(end);
  let finalPath = [];

  function rbfsSearch(node, fLimit, pathSet) {
    const curKey = nodeKey(node);
    visited.add(curKey);
    pushStep(steps, visited, toNodes(pathSet), [], node);

    if (curKey === endKey) {
      finalPath = reconstructPath(parent, endKey);
      pushStep(steps, visited, [], finalPath, node);
      return { found: true, f: gScore.get(curKey) ?? 0 };
    }

    const successors = [];
    const gCur = gScore.get(curKey) ?? 0;
    for (const nb of grid.getNeighbors(node.r, node.c)) {
      const nbKey = nodeKey(nb);
      if (pathSet.has(nbKey)) continue;
      const gNb = gCur + 1;
      gScore.set(nbKey, gNb);
      parent.set(nbKey, curKey);
      successors.push({ node: nb, key: nbKey, f: gNb + manhattan(nb, end) });
    }

    if (successors.length === 0) return { found: false, f: Infinity };

    while (true) {
      successors.sort((a, b) => a.f - b.f);
      const best = successors[0];
      if (best.f > fLimit) return { found: false, f: best.f };
      const alt = successors[1]?.f ?? Infinity;
      pathSet.add(best.key);
      const res = rbfsSearch(best.node, Math.min(fLimit, alt), pathSet);
      pathSet.delete(best.key);
      best.f = res.f;
      if (res.found) return res;
    }
  }

  rbfsSearch(start, Infinity, new Set([nodeKey(start)]));
  if (finalPath.length === 0) pushStep(steps, visited, [], [], null);
  return steps;
}

function jumpPointSearch(grid, start, end) {
  const steps = [];
  const visited = new Set();
  const parent = new Map();
  const gScore = new Map();
  const open = [];
  const startKey = nodeKey(start);
  const endKey = nodeKey(end);

  function walkable(r, c) {
    return grid.isValid(r, c) && grid.cells[r][c].type !== 'wall';
  }

  function hasForced(r, c, dr, dc) {
    if (dr !== 0) {
      return (
        (walkable(r, c + 1) && !walkable(r - dr, c + 1)) ||
        (walkable(r, c - 1) && !walkable(r - dr, c - 1))
      );
    }
    return (
      (walkable(r + 1, c) && !walkable(r + 1, c - dc)) ||
      (walkable(r - 1, c) && !walkable(r - 1, c - dc))
    );
  }

  function jump(r, c, dr, dc) {
    const nr = r + dr;
    const nc = c + dc;
    if (!walkable(nr, nc)) return null;
    if (nr === end.r && nc === end.c) return { r: nr, c: nc };
    if (hasForced(nr, nc, dr, dc)) return { r: nr, c: nc };
    return jump(nr, nc, dr, dc);
  }

  function expandJumpPath(path) {
    if (path.length < 2) return path;
    const expanded = [path[0]];
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const cur = path[i];
      const dr = Math.sign(cur.r - prev.r);
      const dc = Math.sign(cur.c - prev.c);
      let r = prev.r;
      let c = prev.c;
      while (r !== cur.r || c !== cur.c) {
        r += dr;
        c += dc;
        expanded.push({ r, c });
      }
    }
    return expanded;
  }

  parent.set(startKey, null);
  gScore.set(startKey, 0);
  open.push({ node: start, priority: manhattan(start, end) });

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (open.length > 0) {
    const { node: cur } = popBest(open);
    const curKey = nodeKey(cur);
    if (visited.has(curKey)) continue;
    visited.add(curKey);

    if (curKey === endKey) {
      const rawPath = reconstructPath(parent, endKey);
      pushStep(steps, visited, [], expandJumpPath(rawPath), cur);
      return steps;
    }

    for (const [dr, dc] of dirs) {
      const jp = jump(cur.r, cur.c, dr, dc);
      if (!jp) continue;
      const jpKey = nodeKey(jp);
      if (visited.has(jpKey)) continue;
      const dist = Math.abs(jp.r - cur.r) + Math.abs(jp.c - cur.c);
      const nextG = (gScore.get(curKey) ?? Infinity) + dist;
      if (nextG < (gScore.get(jpKey) ?? Infinity)) {
        gScore.set(jpKey, nextG);
        parent.set(jpKey, curKey);
        open.push({ node: jp, priority: nextG + manhattan(jp, end) });
      }
    }

    pushStep(steps, visited, open.map(i => i.node), [], cur);
  }

  pushStep(steps, visited, [], [], null);
  return steps;
}

function contractionHierarchies(grid, start, end) {
  const steps = [];
  const startKey = nodeKey(start);
  const endKey = nodeKey(end);

  const nodes = [];
  const baseAdj = new Map();
  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (grid.cells[r][c].type === 'wall') continue;
      const n = { r, c };
      const k = nodeKey(n);
      nodes.push(n);
      baseAdj.set(k, grid.getNeighbors(r, c));
    }
  }

  const rank = new Map();
  for (const n of nodes) {
    rank.set(nodeKey(n), (grid.size * 2) - manhattan(n, end));
  }

  const upAdj = new Map();
  const downAdj = new Map();
  for (const n of nodes) {
    const k = nodeKey(n);
    upAdj.set(k, []);
    downAdj.set(k, []);
  }

  for (const n of nodes) {
    const k = nodeKey(n);
    const r1 = rank.get(k) ?? 0;
    for (const nb of baseAdj.get(k) ?? []) {
      const nk = nodeKey(nb);
      const r2 = rank.get(nk) ?? 0;
      if (r2 >= r1) upAdj.get(k).push(nb);
      if (r2 <= r1) downAdj.get(k).push(nb);
    }
  }

  const parent = new Map([[startKey, null]]);
  const gScore = new Map([[startKey, 0]]);
  const visited = new Set();
  const open = [{ node: start, priority: 0 }];

  while (open.length > 0) {
    const { node: cur } = popBest(open);
    const curKey = nodeKey(cur);
    if (visited.has(curKey)) continue;
    visited.add(curKey);

    if (curKey === endKey) {
      pushStep(steps, visited, [], reconstructPath(parent, endKey), cur);
      return steps;
    }

    const upward = upAdj.get(curKey) ?? [];
    const fallback = downwardFallback(cur);
    const neighbors = upward.length > 0 ? upward : fallback;

    for (const nb of neighbors) {
      const nbKey = nodeKey(nb);
      if (visited.has(nbKey)) continue;
      const nextG = (gScore.get(curKey) ?? Infinity) + 1;
      if (nextG < (gScore.get(nbKey) ?? Infinity)) {
        gScore.set(nbKey, nextG);
        parent.set(nbKey, curKey);
        open.push({ node: nb, priority: nextG + manhattan(nb, end) * 0.25 });
      }
    }

    pushStep(steps, visited, open.map(i => i.node), [], cur);
  }

  function downwardFallback(node) {
    const k = nodeKey(node);
    const list = downAdj.get(k) ?? [];
    return list.length > 0 ? list : (baseAdj.get(k) ?? []);
  }

  pushStep(steps, visited, [], [], null);
  return steps;
}

export function runAlgorithm(name, grid, start, end, options = {}) {
  const g = grid.clone();
  if (!start || !end) return [];

  if (name === 'bfs') return bfs(g, start, end);
  if (name === 'dfs') return dfs(g, start, end);
  if (name === 'a*') return aStar(g, start, end);
  if (name === 'ids') return ids(g, start, end);
  if (name === 'dijkstra') return dijkstra(g, start, end);
  if (name === 'bellman-ford') return bellmanFord(g, start, end);
  if (name === 'ucs') return ucs(g, start, end);
  if (name === 'bidirectional-bfs') return bidirectionalBfs(g, start, end);
  if (name === 'greedy-best-first') return greedyBestFirst(g, start, end);
  if (name === 'beam-search') return beamSearch(g, start, end, options.beamK ?? 3);
  if (name === 'ida*') return idaStar(g, start, end);
  if (name === 'rbfs') return rbfs(g, start, end);
  if (name === 'jump-point-search') return jumpPointSearch(g, start, end);
  if (name === 'contraction-hierarchies') return contractionHierarchies(g, start, end);
  return [];
}
