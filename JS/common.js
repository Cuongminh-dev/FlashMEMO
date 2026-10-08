function openNameModal() {
    const input = document.getElementById('nameModalInput');
    input.value = document.getElementById('playerName').textContent;
    document.getElementById('nameModalOverlay').classList.remove('hidden');
    input.focus();
    input.select();
}
function closeNameModal() {
    document.getElementById('nameModalOverlay').classList.add('hidden');
}
function saveNameFromModal() {
    const input = document.getElementById('nameModalInput');
    let newName = input.value.trim();
    if (newName === '') return;
    localStorage.setItem('playerName', newName);
    document.getElementById('playerName').textContent = newName;
    closeNameModal();
}
document.getElementById('nameModalInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveNameFromModal();
});
const NUMBER_CONFIG = {
    easy: { gridSize: 3, startCount: 3, observeTime: 4500, timeLimit: null },
    medium: { gridSize: 4, startCount: 5, observeTime: 3500, timeLimit: null },
    hard: { gridSize: 4, startCount: 6, observeTime: 2200, timeLimit: 12000 },
};
const PATH_CONFIG = {
    easy: { gridSize: 5, moveSpeed: 600, timeLimit: null },
    medium: { gridSize: 6, moveSpeed: 450, timeLimit: null },
    hard: { gridSize: 7, moveSpeed: 300, timeLimit: 12000 },
};
const MAZE_CONFIG = {
    easy: { gridSize: 7, observeTime: 120000 },
    medium: { gridSize: 9, observeTime: 60000 },
    hard: { gridSize: 11, observeTime: 30000 },
}
const CONFIG_MAP = {
    numbers: NUMBER_CONFIG,
    path: PATH_CONFIG,
    maze: MAZE_CONFIG
};

let chosenMode = null;
let chosenDiff = null;

function selectMode(mode, el) {
    chosenMode = mode;
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('diffLabel').style.display = 'block';
    document.getElementById('diffRow').classList.add('visible');
    updateStartButton();
}
function selectDiff(diff, el) {
    chosenDiff = diff;
    document.querySelectorAll('.diff-pill').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    updateStartButton();
}
function updateStartButton() {
    const btn = document.getElementById('startBtn');
    if (chosenMode && chosenDiff) {
        btn.classList.add('ready');
        btn.textContent = 'Bắt đầu chơi';
    }
    else {
        btn.classList.remove('ready');
        btn.textContent = 'Chọn dạng chơi và độ khó để bắt đầu';
    }
}
function backToMenu() {
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('menuScreen').classList.remove('hidden');
    document.getElementById('dirPad').classList.add('hidden');
    document.getElementById('dirHint').classList.add('hidden');
    mazeInputEnabled = false;
    clearTimeout(gameTimer);
    clearTimeout(pathAnimTimer);
    clearAnswerTimer();
    clearObserveCountdown();
    score = 0; comboCount = 0; multiplier = 1;
    updateScoreDisplay();
}
let lives = 3, stage = 1, cfg = null;
let score = 0, comboCount = 0, multiplier = 1;
let cellCount = 0, answer = [], playerProgress = 0;
let gameTimer = null, answerTimer = null;
let mazeSize = 0, mazeWalls = null, mazeRow = 0, mazeCol = 0;
let mazeStartRow = 0, mazeStartCol = 0, mazeEndRow = 0, mazeEndCol = 0;
let mazeInputEnabled = false, mazeContainerRect = null, observeCountdownTimer = null;
let pathAnimTimer = null;
let currentMoveSpeed = 500;
function startGame() {
    if (!chosenMode || !chosenDiff) return;
    cfg = CONFIG_MAP[chosenMode][chosenDiff];
    lives = 3; stage = 1;
    score = 0; comboCount = 0; multiplier = 1;
    updateScoreDisplay();
    document.getElementById('menuScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    if (chosenMode === 'numbers') {
        cellCount = cfg.startCount;
        playSequenceStage();
    }
    else if (chosenMode === 'path') {
        currentMoveSpeed = cfg.moveSpeed;
        playPathStage();
    }
    else {
        playMazeStage();
    }
}
function updateScoreDisplay() {
    document.getElementById('scoreDisplay').textContent = score + ' điểm';
    const comboEl = document.getElementById('comboDisplay');
    if (multiplier > 1) {
        comboEl.textContent = 'x' + multiplier + ' COMBO';
        comboEl.classList.remove('hidden');
        comboEl.style.animation = 'none';
        comboEl.offsetHeight;
        comboEl.style.animation = 'popCorrect 0.3s ease';
    } else {
        comboEl.classList.add('hidden');
    }
}
function updateHeader() {
    document.getElementById('livesDisplay').textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    document.getElementById('stageDisplay').textContent = 'Màn ' + stage;
}
function handleSequencePick(pos, cellEl) {
    const expected = answer[playerProgress];
    if (pos === expected) {
        cellEl.classList.add('picked');
        cellEl.textContent = chosenMode === 'numbers' ? (playerProgress + 1) : '●';
        cellEl.onclick = null;
        playerProgress++;
        registerCorrectPick();
        if (playerProgress === answer.length) { clearAnswerTimer(); onStageCleared(); }
    }
    else {
        onWrongPick(cellEl);
    }
}
function onWrongPick(cellEl) {
    cellEl.classList.add('wrong');
    resetCombo();
    loseLife();
    if (lives <= 0) return;
    const statusEl = document.getElementById('statusText');
    statusEl.textContent = 'Sai rồi! Hãy thử lại.';
    statusEl.className = 'error';
    clearAnswerTimer();
    //gameTimer = setTimeout(restartCurrentStage, 1200);
}
function loseLife() {
    lives--;
    updateHeader();
    if (lives <= 0) {
        const statusEl = document.getElementById('statusText');
        statusEl.textContent = 'Hết mạng! Bạn dừng lại ở màn ' + stage + '.';
        statusEl.className = 'error';
        document.querySelectorAll('.grid-cell').forEach(c => c.onclick = null);
        document.getElementById('dirPad').classList.add('hidden');
        document.getElementById('dirHint').classList.add('hidden');
        mazeInputEnabled = false;
        clearAnswerTimer();
        clearObserveCountdown();
        clearTimeout(gameTimer);
        clearTimeout(pathAnimTimer);
    }
}
function startAnswerTimer() {
    clearAnswerTimer();
    if (!cfg.timeLimit) return;
    const timerEl = document.getElementById('timerDisplay');
    timerEl.classList.remove('hidden');
    let remaining = cfg.timeLimit;
    timerEl.textContent = (remaining / 1000).toFixed(1) + 's';
    answerTimer = setInterval(() => {
        remaining -= 100;
        if (remaining <= 0) {
            clearInterval(answerTimer);
            timerEl.classList.add('hidden');
            onTimeUp();
        } else {
            timerEl.textContent = (remaining / 1000).toFixed(1) + 's';
        }
    }, 100);
}

function clearAnswerTimer() {
    if (answerTimer) { clearInterval(answerTimer); answerTimer = null; }
    document.getElementById('timerDisplay').classList.add('hidden');
}

function onTimeUp() {
    const statusEl = document.getElementById('statusText');
    statusEl.textContent = 'Hết giờ!';
    statusEl.className = 'error';
    loseLife();
    if (lives <= 0) return;
    gameTimer = setTimeout(restartCurrentStage, 1200);
}
function onStageCleared() {
    const statusEl = document.getElementById('statusText');
    statusEl.textContent = 'Chính xác! Sang màn tiếp theo...';
    statusEl.className = 'success';
    stage++;
    updateHeader();

    if (chosenMode === 'numbers') {
        if (stage % 2 === 1) cellCount++;
        gameTimer = setTimeout(playSequenceStage, 1200);
    } else if (chosenMode === 'path') {
        currentMoveSpeed = Math.max(180, currentMoveSpeed - 25);
        gameTimer = setTimeout(playPathStage, 1200);
    } else {
        gameTimer = setTimeout(playMazeStage, 1200);
    }
}

function restartCurrentStage() {
    if (chosenMode === 'numbers') playSequenceStage();
    else if (chosenMode === 'path') playPathStage();
    else playMazeStage();
}
function registerCorrectPick() {
    comboCount++;
    multiplier = Math.min(5, 1 + Math.floor(comboCount / 5));
    score += 1 * multiplier;
    updateScoreDisplay();
}

function resetCombo() {
    comboCount = 0;
    multiplier = 1;
    updateScoreDisplay();
}