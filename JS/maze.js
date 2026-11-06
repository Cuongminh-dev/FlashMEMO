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
function printMaze(walls) {
    const size = walls.length;
    let text = '+' + '---+'.repeat(size) + '\n';
    for (let r = 0; r < size; r++) {
        let line = '|';
        let bottom = '+';
        for (let c = 0; c < size; c++) {
            line += '   ' + (walls[r][c].right ? '|' : ' ');
            bottom += (walls[r][c].bottom ? '---' : '   ') + '+';
        }
        text += line + '\n' + bottom + '\n';
    }
    console.log(text);
}
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

