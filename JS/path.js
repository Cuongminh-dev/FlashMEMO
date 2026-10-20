let inputEnabled = false
function getNeighbors(pos, size) {
    const row = Math.floor(pos / size), col = pos % size, result = [];
    if (row > 0) result.push(pos - size);
    if (row < size - 1) result.push(pos + size);
    if (col > 0) result.push(pos - 1);
    if (col < size - 1) result.push(pos + 1);
    return result;
}
function generatePathToLastRow(size, minLen, maxLen) {
    maxLen = Math.max(maxLen, size);
    minLen = Math.min(minLen, maxLen);
    while (true) {
        const startCol = Math.floor(Math.random() * size);
        let stack = [startCol];
        let visited = new Set([startCol]);
        let reached = false;

        while (true) {
            const current = stack[stack.length - 1];
            const curRow = Math.floor(current / size);
            if (curRow === size - 1) {
                reached = true;
                break;
            }

            const neighbors = getNeighbors(current, size).filter(n => !visited.has(n));
            if (neighbors.length === 0) {
                stack.pop();
                if (stack.length === 0) break;
                continue;
            }
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            stack.push(next);
            visited.add(next);
        }
        if (reached && stack.length >= minLen && stack.length <= maxLen) return stack;
    }
}
function buildEmptyGrid(size) {
    const grid = document.getElementById('gameGrid');
    grid.style.display = 'grid';
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    for (let pos = 0; pos < size * size; pos++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.onclick = () => { if (inputEnabled) handleSequencePick(pos, cell); };
        grid.appendChild(cell);
    }
}

function animatePathReveal(path, stepDuration, onDone) {
    const grid = document.getElementById('gameGrid');
    let i = 0;
    function step() {
        if (i > 0) {
            const prevCell = grid.children[path[i - 1]];
            if (prevCell) { prevCell.classList.remove('path-lit'); prevCell.textContent = ''; }
        }
        if (i < path.length) {
            const cell = grid.children[path[i]];
            cell.classList.add('path-lit');
            if (i === 0) cell.textContent = 'S';
            else if (i === path.length - 1) cell.textContent = 'K';
            i++;
            pathAnimTimer = setTimeout(step, stepDuration);
        }
        else {
            pathAnimTimer = setTimeout(() => {
                const lastCell = grid.children[path[path.length - 1]];
                if (lastCell) { lastCell.classList.remove('path-lit'); lastCell.textContent = ''; }
                onDone();
            }, stepDuration);
        }
    }
    step();
}
function playPathStage() {
    updateHeader();
    playerProgress = 0;
    inputEnabled = false;
    const statusEl = document.getElementById('statusText');

    const maxLen = Math.min(cfg.maxLenCap, cfg.maxLen + Math.floor((stage - 1) / 2));
    answer = generatePathToLastRow(cfg.gridSize, cfg.minLen, maxLen);
    cfg.timeLimit = cfg.timePerCell ? answer.length * cfg.timePerCell + cfg.timeBonus : null;
    buildEmptyGrid(cfg.gridSize);

    statusEl.textContent = 'Hãy ghi nhớ đường đi...';
    statusEl.className = 'active';

    clearTimeout(gameTimer);
    clearTimeout(pathAnimTimer);
    animatePathReveal(answer, currentMoveSpeed, () => {
        inputEnabled = true;
        statusEl.textContent = 'Vẽ lại đúng đường đi!';
        statusEl.className = 'active';
        startAnswerTimer();
    });
}