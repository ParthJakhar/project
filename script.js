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

// Algorithm information including time complexity
const algorithmInfo = {
  dijkstra: {
    name: "Dijkstra's Algorithm",
    time: "O((V+E) log V)",
    space: "O(V)",
    description: "Finds shortest path with weighted edges (uniform in our case)"
  },
  astar: {
    name: "A* Search",
    time: "O(E) - O(b^d) with good heuristic",
    space: "O(V)",
    description: "Uses heuristic to find path faster, optimal with admissible heuristic"
  },
  greedy: {
    name: "Greedy Best-First",
    time: "O(b^d) - not optimal",
    space: "O(b^d)",
    description: "Prioritizes nodes closer to goal, may not find shortest path"
  },
  bfs: {
    name: "Breadth-First Search",
    time: "O(V+E)",
    space: "O(V)",
    description: "Explores all neighbors first, finds shortest path in unweighted graph"
  },
  dfs: {
    name: "Depth-First Search",
    time: "O(V+E)",
    space: "O(V)",
    description: "Explores as far as possible first, not optimal for shortest path"
  }
};

// Modified algorithm functions to return performance data
async function runAlgorithm(algorithm,grid) {
  resetVisualization();
  const startTime = performance.now();
  
  switch(algorithm) {
    case "dijkstra": await dijkstra(grid); break;
    case "astar": await astar(grid); break;
    case "greedy": await greedyBestFirst(grid); break;
    case "bfs": await bfs(grid); break;
    case "dfs": await dfs(grid); break;
  }
  
  const endTime = performance.now();
  return {
    time: (endTime - startTime).toFixed(2),
    visited: countVisitedNodes(),
    pathLength: getPathLength()
  };
}

function countVisitedNodes() {
  let count = 0;
  for (let row of grid) {
    for (let node of row) {
      if (node.visited) count++;
    }
  }
  return count;
}

function getPathLength() {
  let curr = endNode;
  let length = 0;
  while (curr && curr.previous) {
    length++;
    curr = curr.previous;
  }
  return length;
}
function cloneGrid(originalGrid) {
  return originalGrid.map(row => row.map(cell => ({
    row: cell.row,
    col: cell.col,
    distance: Infinity,
    visited: false,
    previous: null,
    wall: cell.wall,
    element: null // will be set in visual grid
  })));
}


// Main comparison function
async function compareAlgorithms() {
  const algorithms = ["dijkstra", "astar", "greedy", "bfs", "dfs"];
  const resultsContainer = document.getElementById("comparison-results");
  resultsContainer.innerHTML = "";
  
  // Run all algorithms in parallel
  const promises = algorithms.map(alg => runAlgorithm(alg));
  const results = await Promise.all(promises);
  
  // Display results
  results.forEach((result, index) => {
    const alg = algorithms[index];
    const info = algorithmInfo[alg];
    
    const card = document.createElement("div");
    card.className = "algorithm-card";
    card.innerHTML = `
      <div class="algorithm-title">${info.name}</div>
      <div class="complexity-info">
        <div>Time: ${info.time}</div>
        <div>Space: ${info.space}</div>a
        <div>${info.description}</div>
      </div>
      <div class="time-info">
        Execution: ${result.time} ms
      </div>
      <div>Visited nodes: ${result.visited}</div>
      <div>Path length: ${result.pathLength}</div>
    `;
    
    resultsContainer.appendChild(card);
  });
}

// Add event listener for comparison button
document.getElementById("compare-btn").addEventListener("click", compareAlgorithms);

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
  resetVisualization()

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
  resetVisualization()

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



async function greedyBestFirst() {
  if (!startNode || !endNode) {
    alert("Please set both start and end nodes.");
    return;
  }
  resetVisualization()

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
  resetVisualization(); 
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
  resetVisualization()
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
  resetVisualization()

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
function resetVisualization() {
  for (let row of grid) {
    for (let node of row) {
      if (!node.wall && node !== startNode && node !== endNode) {
        node.element.className = "w-5 h-5 border border-gray-200 bg-white transition-all duration-150";
      }
      node.visited = false;
      node.previous = null;
      node.distance = Infinity;
    }
  }
  document.getElementById('path-length').textContent = '';
}
async function animatePath() {
  // First clear any existing path
  for (let row of grid) {
   for (let node of row) {
     if (node.element.classList.contains("bg-yellow-400")) {
       node.element.classList.remove("bg-yellow-400");
       if (!node.wall && node !== startNode && node !== endNode) {
         node.element.classList.add("bg-white");
       }
     }
   }
 }

 let curr = endNode;
 const path = [];
 while (curr) {
   path.push(curr);
   curr = curr.previous;
 }
 
 if (path.length === 1 && path[0] === endNode && endNode.previous === null) {
   document.getElementById('path-length').textContent = "No path found!";
   return;
 }

 path.reverse();
 let length = 0;
 for (let node of path) {
   if (node !== startNode && node !== endNode) {
     node.element.classList.remove("bg-blue-300", "bg-purple-300", "bg-orange-300", "bg-cyan-300", "bg-pink-300");
     node.element.classList.add("bg-yellow-400");
     await new Promise(r => setTimeout(r, 30));
     length++;
   }
 }

 document.getElementById('path-length').textContent = `Path length: ${length}`;
}
// Add this to your existing code

// Modified comparison function with parallel execution
async function compareAlgorithms() {
  const algorithms = ["dijkstra", "astar", "greedy", "bfs", "dfs"];
  const resultsContainer = document.getElementById("comparison-results");
  resultsContainer.innerHTML = "<div class='text-center py-4'>Running comparisons...</div>";
  
  // Save original grid state
  const originalGrid = JSON.stringify(grid.map(row => 
    row.map(({wall, row, col}) => ({wall, row, col}))
  ));
  
  // Create a clean grid copy for each algorithm
  const gridCopies = {};
  for (const alg of algorithms) {
    gridCopies[alg] = cloneGrid(grid);
  }
  
  // Run all algorithms in parallel
  const startTime = performance.now();
  const promises = algorithms.map(alg => 
    runAlgorithmOnGrid(alg, gridCopies[alg])
      .then(result => ({alg, result}))
      .catch(error => ({alg, error}))
  );
  
  const comparisons = await Promise.all(promises);
  const totalTime = performance.now() - startTime;
  
  // Restore original grid
  resetGrid();
  const gridData = JSON.parse(originalGrid);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c].wall = gridData[r][c].wall;
      if (grid[r][c].wall) {
        grid[r][c].element.classList.add('bg-black');
      }
    }
  }
  
  // Display results
  displayComparisonResults(comparisons, totalTime);
}

function cloneGrid(originalGrid) {
  return originalGrid.map(row => row.map(cell => ({
    ...cell,
    distance: Infinity,
    visited: false,
    previous: null,
    element: null // We won't need the actual DOM element for comparisons
  })));
}

async function runAlgorithmOnGrid(algorithm, gridCopy) {
  // Find start and end nodes in the copy
  const startNodeCopy = gridCopy.flat().find(node => 
    node.row === startNode.row && node.col === startNode.col
  );
  const endNodeCopy = gridCopy.flat().find(node => 
    node.row === endNode.row && node.col === endNode.col
  );
  
  const startTime = performance.now();
  
  // Run the algorithm (without visualization)
  switch(algorithm) {
    case "dijkstra": await dijkstraForComparison(gridCopy, startNodeCopy, endNodeCopy); break;
    case "astar": await astarForComparison(gridCopy, startNodeCopy, endNodeCopy); break;
    case "greedy": await greedyForComparison(gridCopy, startNodeCopy, endNodeCopy); break;
    case "bfs": await bfsForComparison(gridCopy, startNodeCopy, endNodeCopy); break;
    case "dfs": await dfsForComparison(gridCopy, startNodeCopy, endNodeCopy); break;
  }
  
  const endTime = performance.now();
  
  return {
    time: (endTime - startTime).toFixed(2),
    visited: countVisitedNodesInCopy(gridCopy),
    pathLength: getPathLengthInCopy(gridCopy, endNodeCopy),
    success: endNodeCopy.previous !== null
  };
}

// Algorithm implementations without visualization for comparison
async function dijkstraForComparison(grid, startNode, endNode) {
  const unvisited = [];
  for (let row of grid) {
    for (let node of row) {
      node.distance = Infinity;
      node.visited = false;
      node.previous = null;
      if (!node.wall) unvisited.push(node);
    }
  }

  startNode.distance = 0;

  while (unvisited.length) {
    unvisited.sort((a, b) => a.distance - b.distance);
    const current = unvisited.shift();
    if (current.wall) continue;
    if (current.distance === Infinity) break;

    current.visited = true;
    if (current === endNode) break;

    for (let neighbor of getNeighborsInCopy(grid, current)) {
      if (!neighbor.visited && !neighbor.wall) {
        const alt = current.distance + 1;
        if (alt < neighbor.distance) {
          neighbor.distance = alt;
          neighbor.previous = current;
        }
      }
    }
  }
}

async function astarForComparison(grid, startNode, endNode) {
  for (let row of grid) {
    for (let node of row) {
      node.distance = Infinity;
      node.visited = false;
      node.previous = null;
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

    for (let neighbor of getNeighborsInCopy(grid, current)) {
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
}

async function greedyForComparison(grid, startNode, endNode) {
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

    for (const neighbor of getNeighborsInCopy(grid, current)) {
      if (!neighbor.visited && !neighbor.wall && !openSet.includes(neighbor)) {
        neighbor.previous = current;
        openSet.push(neighbor);
      }
    }
  }
}

async function bfsForComparison(grid, startNode, endNode) {
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

    for (let neighbor of getNeighborsInCopy(grid, current)) {
      if (!neighbor.visited && !neighbor.wall) {
        neighbor.visited = true;
        neighbor.previous = current;
        queue.push(neighbor);
      }
    }
  }
}

async function dfsForComparison(grid, startNode, endNode) {
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

    for (let neighbor of getNeighborsInCopy(grid, current)) {
      if (!neighbor.visited && !neighbor.wall) {
        neighbor.visited = true;
        neighbor.previous = current;
        stack.push(neighbor);
      }
    }
  }
}

function getNeighborsInCopy(grid, node) {
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

function countVisitedNodesInCopy(gridCopy) {
  let count = 0;
  for (let row of gridCopy) {
    for (let node of row) {
      if (node.visited) count++;
    }
  }
  return count;
}

function getPathLengthInCopy(gridCopy, endNodeCopy) {
  let curr = endNodeCopy;
  let length = 0;
  while (curr && curr.previous) {
    length++;
    curr = curr.previous;
  }
  return length-1;
}

function displayComparisonResults(comparisons, totalTime) {
  const resultsContainer = document.getElementById("comparison-results");
  resultsContainer.innerHTML = "";
  
  // Sort results by time (fastest first)
  comparisons.sort((a, b) => a.result.time - b.result.time);
  
  // Create a table for results
  const table = document.createElement("table");
  table.className = "w-full border-collapse";
  
  // Table header
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr class="bg-gray-100">
      <th class="p-3 text-left">Algorithm</th>
      <th class="p-3 text-left">Time (ms)</th>
      <th class="p-3 text-left">Visited Nodes</th>
      <th class="p-3 text-left">Path Length</th>
      <th class="p-3 text-left">Status</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Table body
  const tbody = document.createElement("tbody");
  comparisons.forEach(({alg, result}) => {
    const info = algorithmInfo[alg];
    const row = document.createElement("tr");
    row.className = "border-b border-gray-200 hover:bg-gray-50";
    
    row.innerHTML = `
      <td class="p-3">
        <div class="font-medium">${info.name}</div>
        <div class="text-xs text-gray-500">${info.time} time</div>
      </td>
      <td class="p-3">${result.time}</td>
      <td class="p-3">${result.visited}</td>
      <td class="p-3">${result.success ? result.pathLength : "N/A"}</td>
      <td class="p-3">
        ${result.success ? 
          '<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Success</span>' : 
          '<span class="px-2 py-1 bg-red-100 text-red-800 rounded">Failed</span>'}
      </td>
    `;
    
    // Highlight the fastest successful algorithm
    if (result.success && result.time === comparisons[0].result.time) {
      row.classList.add("bg-yellow-50");
      const fastestBadge = document.createElement("div");
      fastestBadge.className = "text-xs font-bold text-yellow-600";
      fastestBadge.textContent = "Fastest";
      row.querySelector("td").appendChild(fastestBadge);
    }
    
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  
  // Summary
  const summary = document.createElement("div");
  summary.className = "mt-4 p-3 bg-blue-50 rounded";
  summary.innerHTML = `
    <div class="font-medium">Comparison Summary</div>
    <div>Total comparison time: ${totalTime.toFixed(2)} ms</div>
    <div>Grid size: ${rows} × ${cols} (${rows * cols} nodes)</div>
    <div>Walls: ${grid.flat().filter(node => node.wall).length} nodes</div>
  `;
  
  resultsContainer.appendChild(table);
  resultsContainer.appendChild(summary);
}


createGrid();
