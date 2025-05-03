const rows = 20, cols = 40;
let isDragging = false;
let placingWall = true;
let startNode = null;
let endNode = null;
let movingStart = false;
let movingEnd = false;

const gridElement = document.getElementById('grid');
const grid = [];

function createGrid() {
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = "w-5 h-5 border border-gray-200 bg-white transition-all duration-150";
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener('mousedown', () => handleMouseDown(cell));
      cell.addEventListener('mouseenter', () => handleMouseEnter(cell));
      cell.addEventListener('mouseup', () => { isDragging = false; });

      gridElement.appendChild(cell);
      row.push({
        row: r, col: c, distance: Infinity, visited: false, previous: null, wall: false, element: cell
      });
    }
    grid.push(row);
  }
}

function handleMouseDown(cell) {
  const r = +cell.dataset.row;
  const c = +cell.dataset.col;
  const node = grid[r][c];

  if (node === startNode) {
    movingStart = true;
    isDragging = true;
    return;
  }
  if (node === endNode) {
    movingEnd = true;
    isDragging = true;
    return;
  }
  if (!startNode) {
    startNode = node;
    node.element.classList.add('bg-green-500');
    return;
  }
  if (!endNode && node !== startNode) {
    endNode = node;
    node.element.classList.add('bg-red-500');
    return;
  }

  if (node !== startNode && node !== endNode) {
    node.wall = !node.wall;
    node.element.classList.toggle('bg-black');
    isDragging = true;
    placingWall = node.wall;
  }
}

function handleMouseEnter(cell) {
  if (!isDragging) return;
  const r = +cell.dataset.row;
  const c = +cell.dataset.col;
  const node = grid[r][c];

  if (movingStart && node !== endNode) {
    startNode.element.classList.remove('bg-green-500');
    startNode = node;
    node.element.classList.add('bg-green-500');
    return;
  }
  if (movingEnd && node !== startNode) {
    endNode.element.classList.remove('bg-red-500');
    endNode = node;
    node.element.classList.add('bg-red-500');
    return;
  }

  if (node === startNode || node === endNode) return;
  node.wall = placingWall;
  node.element.classList.toggle('bg-black', placingWall);
  node.element.classList.toggle('bg-white', !placingWall);
}

document.body.addEventListener('mouseup', () => {
  isDragging = false;
  movingStart = false;
  movingEnd = false;
});

function getNeighbors(node) {
  let dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  if (document.getElementById('diagonal').checked) {
    dirs.push([1,1], [1,-1], [-1,1], [-1,-1]);
  }
  const neighbors = [];
  for (let [dr, dc] of dirs) {
    const nr = node.row + dr;
    const nc = node.col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      neighbors.push(grid[nr][nc]);
    }
  }
  return neighbors;
}

function getSpeed() {
  const speed = document.getElementById('speed').value;
  if (speed === 'fast') return 5;
  if (speed === 'medium') return 20;
  return 50;
}

async function dijkstra() {
  if (!startNode || !endNode) {
    alert("Please set both start and end nodes.");
    return;
  }

  const unvisited = [];
  for (let row of grid) {
    for (let node of row) {
      node.distance = Infinity;
      node.visited = false;
      node.previous = null;
      if (!node.wall && node !== startNode && node !== endNode)
        node.element.className = "w-5 h-5 border border-gray-200 bg-white transition-all duration-150";
      unvisited.push(node);
    }
  }

  startNode.distance = 0;

  while (unvisited.length) {
    unvisited.sort((a, b) => a.distance - b.distance);
    const current = unvisited.shift();
    if (current.wall) continue;
    if (current.distance === Infinity) break;

    current.visited = true;
    if (current !== startNode && current !== endNode) {
      current.element.classList.add("bg-blue-300");
      await new Promise(r => setTimeout(r, getSpeed()));
    }

    if (current === endNode) break;

    for (let neighbor of getNeighbors(current)) {
      if (!neighbor.visited && !neighbor.wall) {
        const alt = current.distance + 1;
        if (alt < neighbor.distance) {
          neighbor.distance = alt;
          neighbor.previous = current;
        }
      }
    }
  }

  animatePath();
}

async function animatePath() {
  let curr = endNode;
  const path = [];
  while (curr) {
    path.push(curr);
    curr = curr.previous;
  }
  path.reverse();
  for (let node of path) {
    if (node !== startNode && node !== endNode) {
      node.element.classList.remove("bg-blue-300");
      node.element.classList.add("bg-yellow-400");
      await new Promise(r => setTimeout(r, 30));
    }
  }
}

function resetGrid() {
  gridElement.innerHTML = '';
  grid.length = 0;
  startNode = null;
  endNode = null;
  createGrid();
}

function generateMaze() {
  for (let row of grid) {
    for (let node of row) {
      if (node !== startNode && node !== endNode) {
        if (Math.random() < 0.3) {
          node.wall = true;
          node.element.classList.add('bg-black');
        } else {
          node.wall = false;
          node.element.classList.remove('bg-black');
          node.element.classList.add('bg-white');
        }
      }
    }
  }
}

//document.getElementById('start-btn').addEventListener('click', dijkstra);
document.getElementById('reset-btn').addEventListener('click', resetGrid);
document.getElementById('maze-btn').addEventListener('click', generateMaze);

function heuristic(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

async function astar() {
  if (!startNode || !endNode) {
    alert("Please set both start and end nodes.");
    return;
  }

  for (let row of grid) {
    for (let node of row) {
      node.distance = Infinity;
      node.visited = false;
      node.previous = null;
      if (!node.wall && node !== startNode && node !== endNode)
        node.element.className = "w-5 h-5 border border-gray-200 bg-white transition-all duration-150";
    }
  }

  startNode.distance = 0;
  const openSet = [startNode];

  while (openSet.length > 0) {
    openSet.sort((a, b) => (a.distance + heuristic(a, endNode)) - (b.distance + heuristic(b, endNode)));
    const current = openSet.shift();

    if (current.wall) continue;
    if (current === endNode) break;

    current.visited = true;
    if (current !== startNode && current !== endNode) {
      current.element.classList.add("bg-purple-300");
      await new Promise(r => setTimeout(r, getSpeed()));
    }

    for (let neighbor of getNeighbors(current)) {
      if (!neighbor.visited && !neighbor.wall) {
        const tentativeG = current.distance + 1;
        if (tentativeG < neighbor.distance) {
          neighbor.distance = tentativeG;
          neighbor.previous = current;
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }
  }

  animatePath();
}

//document.getElementById('astar-btn').addEventListener('click', astar);

function clearWalls() {
  for (let row of grid) {
    for (let node of row) {
      if (node.wall) {
        node.wall = false;
        node.element.classList.remove('bg-black');
        node.element.classList.add('bg-white');
      }
      if (node !== startNode && node !== endNode) {
        node.element.className = "w-5 h-5 border border-gray-200 bg-white transition-all duration-150";
      }
    }
  }
}

document.getElementById('clear-walls-btn').addEventListener('click', clearWalls);

async function animatePath() {
  let curr = endNode;
  const path = [];
  while (curr) {
    path.push(curr);
    curr = curr.previous;
  }
  path.reverse();

  let length = 0;
  for (let node of path) {
    if (node !== startNode && node !== endNode) {
      node.element.classList.remove("bg-blue-300");
      node.element.classList.add("bg-yellow-400");
      await new Promise(r => setTimeout(r, 30));
      length++;
    }
  }

  document.getElementById('path-length').textContent = `Path length: ${length}`;
}

async function greedyBestFirst() {
  if (!startNode || !endNode) {
    alert("Please set both start and end nodes.");
    return;
  }

  for (let row of grid) {
    for (let node of row) {
      node.visited = false;
      node.previous = null;
    }
  }

  const openSet = [startNode];

  while (openSet.length > 0) {
    openSet.sort((a, b) => heuristic(a, endNode) - heuristic(b, endNode));
    const current = openSet.shift();

    if (current === endNode) break;

    current.visited = true;
    if (current !== startNode && current !== endNode) {
      current.element.classList.add("bg-orange-300");
      await new Promise(r => setTimeout(r, getSpeed()));
    }

    for (const neighbor of getNeighbors(current)) {
      if (!neighbor.visited && !neighbor.wall && !openSet.includes(neighbor)) {
        neighbor.previous = current;
        openSet.push(neighbor);
      }
    }
  }

  animatePath();
}

//document.getElementById('greedy-btn').addEventListener('click', greedyBestFirst);
document.getElementById("start-btn").addEventListener("click", () => {
  const algorithm = document.getElementById("algorithm").value;

  switch (algorithm) {
    case "dijkstra":
      dijkstra();
      break;
    case "astar":
      astar();
      break;
    case "greedy":
      greedyBestFirst();
      break;
    case "bfs":
      bfs();
      break;
    case "dfs":
      dfs();
      break;
    default:
      alert("Select a valid algorithm.");
  }
});

//bfs
async function bfs() {
  if (!startNode || !endNode) {
    alert("Please set both start and end nodes.");
    return;
  }

  for (let row of grid) {
    for (let node of row) {
      node.visited = false;
      node.previous = null;
    }
  }

  const queue = [startNode];
  startNode.visited = true;

  while (queue.length > 0) {
    const current = queue.shift();

    if (current === endNode) break;

    if (current !== startNode && current !== endNode) {
      current.element.classList.add("bg-cyan-300");
      await new Promise(r => setTimeout(r, getSpeed()));
    }

    for (let neighbor of getNeighbors(current)) {
      if (!neighbor.visited && !neighbor.wall) {
        neighbor.visited = true;
        neighbor.previous = current;
        queue.push(neighbor);
      }
    }
  }

  animatePath();
}
//dfs
async function dfs() {
  if (!startNode || !endNode) {
    alert("Please set both start and end nodes.");
    return;
  }

  for (let row of grid) {
    for (let node of row) {
      node.visited = false;
      node.previous = null;
    }
  }

  const stack = [startNode];
  startNode.visited = true;

  while (stack.length > 0) {
    const current = stack.pop();

    if (current === endNode) break;

    if (current !== startNode && current !== endNode) {
      current.element.classList.add("bg-pink-300");
      await new Promise(r => setTimeout(r, getSpeed()));
    }

    for (let neighbor of getNeighbors(current)) {
      if (!neighbor.visited && !neighbor.wall) {
        neighbor.visited = true;
        neighbor.previous = current;
        stack.push(neighbor);
      }
    }
  }

  animatePath();
}



createGrid();
