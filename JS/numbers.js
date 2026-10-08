function playSequenceStage() {
    updateHeader();
    playerProgress = 0;
    const statusEl = document.getElementById('statusText');

    const total = cfg.gridSize * cfg.gridSize;
    const positions = Array.from({ length: total }, (_, i) => i);
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    answer = positions.slice(0, cellCount);

    renderSequenceGrid(true);
    statusEl.textContent = 'Hãy ghi nhớ...';
    statusEl.className = 'active';
    clearTimeout(gameTimer);
    gameTimer = setTimeout(() => {
        renderSequenceGrid(false);
        statusEl.textContent = 'Chọn lại theo đúng thứ tự!';
        statusEl.className = 'active';
        startAnswerTimer();
    }, cfg.observeTime);
}
function renderSequenceGrid(showAnswer) {
    const grid = document.getElementById('gameGrid');
    grid.style.display = 'grid';
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${cfg.gridSize}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${cfg.gridSize}, 1fr)`;
    const total = cfg.gridSize * cfg.gridSize;
    for (let pos = 0; pos < total; pos++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        const idx = answer.indexOf(pos);
        if (idx !== -1 && showAnswer) {
            cell.textContent = idx + 1;
        }
        if (!showAnswer) {
            cell.onclick = () => handleSequencePick(pos, cell);
        }
        grid.appendChild(cell);
    }
}