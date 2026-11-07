function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
const MAZE_OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
function generatePerfectMaze(size) {
    const walls = [];
    for (let r = 0; r < size; r++) {
        walls.push([]);
        for (let c = 0; c < size; c++) {
            walls[r].push({ top: true, right: true, bottom: true, left: true });
        }
    }

    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    const stack = [{ r: 0, c: 0 }];
    visited[0][0] = true;
    while (stack.length > 0) {
        const { r, c } = stack[stack.length - 1];
        const dirs = shuffleArray(['top', 'right', 'bottom', 'left']);
        let moved = false;

        for (const dir of dirs) {
            let nr = r, nc = c;
            if (dir === 'top') nr--;
            else if (dir === 'bottom') nr++;
            else if (dir === 'left') nc--;
            else nc++;

            if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
            if (visited[nr][nc]) continue;

            walls[r][c][dir] = false;
            walls[nr][nc][MAZE_OPPOSITE[dir]] = false;
            visited[nr][nc] = true;
            stack.push({ r: nr, c: nc });
            moved = true;
            break;
        }
        if (!moved) stack.pop();
    }

    return walls;
}
// function printMaze(walls) {
//     const size = walls.length;
//     let text = '+' + '---+'.repeat(size) + '\n';
//     for (let r = 0; r < size; r++) {
//         let line = '|';
//         let bottom = '+';
//         for (let c = 0; c < size; c++) {
//             line += '   ' + (walls[r][c].right ? '|' : ' ');
//             bottom += (walls[r][c].bottom ? '---' : '   ') + '+';
//         }
//         text += line + '\n' + bottom + '\n';
//     }
//     console.log(text);
// }
function bfsFarthest(walls, startR, startC) {
    const size = walls.length;
    const dist = Array.from({ length: size }, () => Array(size).fill(-1));
    dist[startR][startC] = 0;
    const queue = [[startR, startC]];
    let head = 0;
    let farthest = [startR, startC];

    while (head < queue.length) {
        const [r, c] = queue[head++];
        const w = walls[r][c];
        const next = [];
        if (!w.top) next.push([r - 1, c]);
        if (!w.bottom) next.push([r + 1, c]);
        if (!w.left) next.push([r, c - 1]);
        if (!w.right) next.push([r, c + 1]);

        for (const [nr, nc] of next) {
            if (dist[nr][nc] === -1) {
                dist[nr][nc] = dist[r][c] + 1;
                if (dist[nr][nc] > dist[farthest[0]][farthest[1]]) farthest = [nr, nc];
                queue.push([nr, nc]);
            }
        }
    }
    return { farthest, dist };
}

function pickStartEnd(walls, minRatio, maxRatio) {
    const size = walls.length;
    const seedR = Math.floor(Math.random() * size);
    const seedC = Math.floor(Math.random() * size);

    const first = bfsFarthest(walls, seedR, seedC);
    const start = first.farthest;
    const second = bfsFarthest(walls, start[0], start[1]);
    const longest = second.dist[second.farthest[0]][second.farthest[1]];

    const lo = Math.max(1, Math.ceil(minRatio * longest));
    const hi = Math.floor(maxRatio * longest);

    const candidates = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const d = second.dist[r][c];
            if (d >= lo && d <= hi) candidates.push([r, c]);
        }
    }

    const end = candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : second.farthest;

    return { start, end, steps: second.dist[end[0]][end[1]] };
}
const MAZE_CELL = 20;
function buildMazeDOM() {
    const grid = document.getElementById('gameGrid');
    grid.style.display = 'block';
    grid.innerHTML = `
        <div id="mazeStage">
            <svg id="mazeSvg" width="100%" height="100%"
                 viewBox="0 0 ${mazeSize * MAZE_CELL} ${mazeSize * MAZE_CELL}"
                 preserveAspectRatio="none"></svg>
            <div id="mazeFog"></div>
            <div id="mazeToken"></div>
        </div>`;
}
function drawMazeWalls() {
    const svg = document.getElementById('mazeSvg');
    let lines = '';
    for (let r = 0; r < mazeSize; r++) {
        for (let c = 0; c < mazeSize; c++) {
            const x = c * MAZE_CELL, y = r * MAZE_CELL, w = mazeWalls[r][c];
            if (w.top) lines += `<line x1="${x}" y1="${y}" x2="${x + MAZE_CELL}" y2="${y}"/>`;
            if (w.left) lines += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + MAZE_CELL}"/>`;
            if (r === mazeSize - 1 && w.bottom) {
                lines += `<line x1="${x}" y1="${y + MAZE_CELL}" x2="${x + MAZE_CELL}" y2="${y + MAZE_CELL}"/>`;
            }
            if (c === mazeSize - 1 && w.right) {
                lines += `<line x1="${x + MAZE_CELL}" y1="${y}" x2="${x + MAZE_CELL}" y2="${y + MAZE_CELL}"/>`;
            }
        }
    }
    const sx = (mazeStartCol + 0.5) * MAZE_CELL;
    const sy = (mazeStartRow + 0.5) * MAZE_CELL;
    const ex = (mazeEndCol + 0.5) * MAZE_CELL;
    const ey = (mazeEndRow + 0.5) * MAZE_CELL;

    svg.innerHTML = `
        <g class="maze-walls">${lines}</g>
        <circle class="maze-start" cx="${sx}" cy="${sy}" r="4"/>
        <circle class="maze-end" cx="${ex}" cy="${ey}" r="4"/>`;

}
function positionToken() {
    const token = document.getElementById('mazeToken');
    const pct = 100 / mazeSize;
    token.style.left = ((mazeCol + 0.5) * pct) + '%';
    token.style.top = ((mazeRow + 0.5) * pct) + '%';
    token.style.width = (pct * 0.5) + '%';
    token.style.height = (pct * 0.5) + '%';
}
const MAZE_LIGHT_RADIUS = 1.3;

function updateFog() {
    const stage = document.getElementById('mazeStage');
    const fog = document.getElementById('mazeFog');
    const cellPx = stage.clientWidth / mazeSize;
    const x = (mazeCol + 0.5) * cellPx;
    const y = (mazeRow + 0.5) * cellPx;
    const radius = cellPx * MAZE_LIGHT_RADIUS;

    fog.style.background = `radial-gradient(circle at ${x}px ${y}px, transparent ${radius}px, var(--bg) ${radius + 1}px)`;
}

function clearFog() {
    document.getElementById('mazeFog').style.background = 'transparent';
}

window.addEventListener('resize', () => {
    if (mazeInputEnabled) updateFog();
});

function startObserveCountdown(ms) {
    const timerEl = document.getElementById('timerDisplay');
    timerEl.classList.remove('hidden');
    let remaining = ms;
    renderCountdown(remaining);
    clearInterval(observeCountdownTimer);
    observeCountdownTimer = setInterval(() => {
        remaining -= 1000;
        if (remaining <= 0) {
            clearObserveCountdown();
        } else {
            renderCountdown(remaining);
        }
    }, 1000);
}

function renderCountdown(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    document.getElementById('timerDisplay').textContent =
        m > 0 ? m + ':' + String(s).padStart(2, '0') : s + 's';
}

function playMazeStage() {
    updateHeader();
    mazeInputEnabled = false;
    mazeSize = cfg.gridSize;
    mazeWalls = generatePerfectMaze(mazeSize);

    const picked = pickStartEnd(mazeWalls, cfg.minRatio, cfg.maxRatio);
    mazeSteps = picked.steps;
    mazeStartRow = picked.start[0];
    mazeStartCol = picked.start[1];
    mazeEndRow = picked.end[0];
    mazeEndCol = picked.end[1];
    mazeRow = mazeStartRow;
    mazeCol = mazeStartCol;

    buildMazeDOM();
    drawMazeWalls();
    positionToken();
    clearFog();

    const statusEl = document.getElementById('statusText');
    statusEl.textContent = 'Ghi nhớ toàn bộ mê cung...';
    statusEl.className = 'active';
    document.getElementById('dirPad').classList.add('hidden');
    document.getElementById('dirHint').classList.add('hidden');

    clearTimeout(gameTimer);
    clearObserveCountdown();
    startObserveCountdown(cfg.observeTime);

    gameTimer = setTimeout(() => {
        clearObserveCountdown();
        mazeInputEnabled = true;
        updateFog();
        statusEl.textContent = 'Dò đường trong bóng tối tới đích!';
        statusEl.className = 'active';
        document.getElementById('dirPad').classList.remove('hidden');
        document.getElementById('dirHint').classList.remove('hidden');
    }, cfg.observeTime);
}
let mazeSteps = 0;

const MAZE_MOVES = {
    up: { wall: 'top', dr: -1, dc: 0 },
    down: { wall: 'bottom', dr: 1, dc: 0 },
    left: { wall: 'left', dr: 0, dc: -1 },
    right: { wall: 'right', dr: 0, dc: 1 },
};

function moveMaze(dir, fromRepeat = false) {
    if (!mazeInputEnabled) return;
    const move = MAZE_MOVES[dir];
    if (!move) return;

    if (mazeWalls[mazeRow][mazeCol][move.wall]) {
        if (!fromRepeat) hitMazeWall();
        return;
    }

    mazeRow += move.dr;
    mazeCol += move.dc;
    positionToken();
    updateFog();

    if (mazeRow === mazeEndRow && mazeCol === mazeEndCol) {
        mazeInputEnabled = false;
        clearFog();
        score += mazeSteps;
        updateScoreDisplay();
        onStageCleared();
    }
}

function hitMazeWall() {
    loseLife();
    if (lives <= 0) {
        clearFog();
        return;
    }
    const statusEl = document.getElementById('statusText');
    statusEl.textContent = 'Đâm tường! Hãy thử hướng khác.';
    statusEl.className = 'error';
}

document.addEventListener('keydown', (e) => {
    if (chosenMode !== 'maze' || !mazeInputEnabled) return;
    const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (keys[e.key]) {
        e.preventDefault();
        moveMaze(keys[e.key], e.repeat);
    }
});
