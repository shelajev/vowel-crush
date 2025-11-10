document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const gameArea = document.getElementById('game-area');
    const scoreDisplay = document.getElementById('score');
    const mistakesDisplay = document.getElementById('mistakes');
    const levelDisplay = document.getElementById('level');
    const gameModeSelect = document.getElementById('game-mode');
    const flightModeSelect = document.getElementById('flight-mode');
    const speedSlider = document.getElementById('speed-slider');
    const startPauseBtn = document.getElementById('start-pause-btn');

    // Game State
    let score = 0;
    let levelMistakes = 0;
    let levelCorrect = 0;
    let currentLevel = 1;
    let gameMode = 'vowels'; // 'vowels' or 'consonants'
    let animationMode = flightModeSelect.value || 'fountain';
    const MIN_SPEED = 1;
    const MAX_SPEED = 10;
    let speed = parseInt(speedSlider.value, 10); // Corresponds to slider value
    let gameInterval;
    let isGamePaused = true;

    // Alphabets and Vowels
    const VOWELS = ['A', 'E', 'I', 'O', 'U', 'Õ', 'Ä', 'Ö', 'Ü'];
    const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'Š', 'Z', 'Ž', 'T', 'V', 'W', 'X', 'Y'];
    const ALPHABET = [...VOWELS, ...CONSONANTS];
    const LEVEL_GOAL = 15;
    const LEVEL_MISTAKE_LIMIT = 3;
    const LEVEL_COLORS = ['#f8b4c8', '#f9d29d', '#fcf7b4', '#c8edc3', '#b7d9f7', '#c3c3f9', '#e5c3f6'];
    const LETTER_WIDTH = 60;
    const LETTER_HEIGHT = 40;
    const LAUNCH_PADDING = 30;
    const GRAVITY_BASE = 0.000625; // lowered gravity so arcs reach ~1.6x higher
    const VERTICAL_SPEED_BASE = 0.7;

    // --- Event Listeners ---

    // Start/Pause Button
    startPauseBtn.addEventListener('click', () => {
        if (isGamePaused) {
            startGame();
        } else {
            pauseGame();
        }
    });

    // Game Mode Change
    gameModeSelect.addEventListener('change', (e) => {
        gameMode = e.target.value;
        resetGame();
    });

    flightModeSelect.addEventListener('change', (e) => {
        animationMode = e.target.value;
        clearLetters();
    });

    // Speed Change
    speedSlider.addEventListener('input', (e) => {
        updateSpeed(parseInt(e.target.value, 10), false);
    });

    // --- Game Logic ---

    function createLetter() {
        const letter = document.createElement('div');
        letter.classList.add('letter');
        
        const char = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        letter.textContent = char;
        const isVowel = VOWELS.includes(char.toUpperCase());
        const shouldCatch = (gameMode === 'vowels' && isVowel) || (gameMode === 'consonants' && !isVowel);
        letter.dataset.shouldCatch = shouldCatch ? 'true' : 'false';
        letter.dataset.handled = 'false';

        const handleInteraction = () => {
            letter.dataset.handled = 'true';
            checkHit(letter, char);
            letter.removeEventListener('mousedown', handleInteraction);
            letter.removeEventListener('touchstart', handleInteraction);
        };

        letter.addEventListener('mousedown', handleInteraction);
        letter.addEventListener('touchstart', handleInteraction);

        const state = animationMode === 'fountain'
            ? createFountainState()
            : createRainState();
        letter._animationState = state;
        letter.style.left = `${state.startX}px`;
        letter.style.top = `${state.startY}px`;

        gameArea.appendChild(letter);
        animateLetter(letter);
    }

    function createFountainState() {
        const gameAreaWidth = gameArea.clientWidth;
        const gameAreaHeight = gameArea.clientHeight;
        const fromLeft = Math.random() < 0.5;
        const cornerJitter = Math.random() * 40;
        const startX = fromLeft
            ? Math.min(LAUNCH_PADDING + cornerJitter, gameAreaWidth * 0.15)
            : Math.max(gameAreaWidth - LAUNCH_PADDING - LETTER_WIDTH - cornerJitter, gameAreaWidth * 0.85 - LETTER_WIDTH);
        const startY = gameAreaHeight + LETTER_HEIGHT;
        const speedFactor = 1 + (speed - 1) * 0.08;
        const vy = (VERTICAL_SPEED_BASE + Math.random() * 0.12) * speedFactor;
        const gravity = GRAVITY_BASE * (0.9 + Math.random() * 0.2) * speedFactor;
        const flightTime = Math.max((2 * vy) / gravity, 600); // milliseconds
        const minTarget = fromLeft ? gameAreaWidth * 0.45 : gameAreaWidth * 0.1;
        const maxTarget = fromLeft ? gameAreaWidth - LAUNCH_PADDING - LETTER_WIDTH : gameAreaWidth * 0.55;
        const rawTarget = minTarget + Math.random() * (maxTarget - minTarget);
        const clampedTarget = Math.max(LAUNCH_PADDING, Math.min(gameAreaWidth - LAUNCH_PADDING - LETTER_WIDTH, rawTarget));
        const vx = (clampedTarget - startX) / flightTime;

        return {
            mode: 'fountain',
            startX,
            startY,
            vx,
            vy,
            gravity,
            elapsed: 0,
            lastTimestamp: null,
            frameId: null,
            removed: false,
            bottomThreshold: gameAreaHeight + LETTER_HEIGHT * 4,
            leftThreshold: -LETTER_WIDTH * 2,
            rightThreshold: gameAreaWidth + LETTER_WIDTH * 2
        };
    }

    function createRainState() {
        const gameAreaWidth = gameArea.clientWidth;
        const gameAreaHeight = gameArea.clientHeight;
        const horizontalRange = Math.max(gameAreaWidth - LAUNCH_PADDING * 2 - LETTER_WIDTH, 1);
        const startX = LAUNCH_PADDING + Math.random() * horizontalRange;
        const startY = -LETTER_HEIGHT * 2;
        const totalDistance = gameAreaHeight + LETTER_HEIGHT * 3;
        const duration = Math.max((11 - speed) * 1500, 900);
        const drift = (Math.random() - 0.5) * gameAreaWidth * 0.2;

        return {
            mode: 'rain',
            startX,
            startY,
            drift,
            totalDistance,
            duration,
            elapsed: 0,
            lastTimestamp: null,
            frameId: null,
            removed: false
        };
    }

    function checkHit(letterElement, char) {
        const isVowel = VOWELS.includes(char.toUpperCase());
        let correctHit = false;

        if (gameMode === 'vowels' && isVowel) {
            correctHit = true;
        } else if (gameMode === 'consonants' && !isVowel) {
            correctHit = true;
        }

        if (correctHit) {
            handleCorrectHit(letterElement);
        } else {
            handleMistake(letterElement);
        }

        // Visual feedback and removal
        stopLetterAnimation(letterElement);
        letterElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            if (letterElement.parentElement) {
                letterElement.remove();
            }
        }, 200);
    }

    function resetGame() {
        score = 0;
        levelCorrect = 0;
        levelMistakes = 0;
        currentLevel = 1;
        scoreDisplay.textContent = score;
        mistakesDisplay.textContent = levelMistakes;
        levelDisplay.textContent = currentLevel;

        clearLetters();
        applyLevelTheme();

        pauseGame();
    }

    function startGame() {
        isGamePaused = false;
        startPauseBtn.textContent = '❚❚';
        startPauseBtn.classList.remove('start-btn');
        startPauseBtn.classList.add('paused');
        gameArea.classList.remove('game-paused');

        startLetterInterval();
    }

    function pauseGame() {
        isGamePaused = true;
        startPauseBtn.textContent = '▶';
        startPauseBtn.classList.add('start-btn');
        startPauseBtn.classList.remove('paused');
        gameArea.classList.add('game-paused');
        clearInterval(gameInterval);
    }

    function handleCorrectHit(letterElement) {
        score++;
        levelCorrect++;
        scoreDisplay.textContent = score;
        letterElement.style.backgroundColor = '#2ecc71';

        if (levelCorrect >= LEVEL_GOAL) {
            advanceLevel();
        }
    }

    function handleMistake(letterElement) {
        registerMistake();
        letterElement.style.backgroundColor = '#e74c3c';
    }

    function registerMistake() {
        levelMistakes++;
        mistakesDisplay.textContent = levelMistakes;
        if (levelMistakes >= LEVEL_MISTAKE_LIMIT) {
            restartLevel();
        }
    }

    function restartLevel() {
        adjustSpeed(-1);
        resetLevelProgress();
        clearLetters();
    }

    function advanceLevel() {
        currentLevel++;
        levelDisplay.textContent = currentLevel;
        adjustSpeed(1);
        resetLevelProgress();
        clearLetters();
        applyLevelTheme();
    }

    function resetLevelProgress() {
        levelCorrect = 0;
        levelMistakes = 0;
        mistakesDisplay.textContent = levelMistakes;
    }

    function clearLetters() {
        const letters = gameArea.querySelectorAll('.letter');
        letters.forEach(letter => {
            letter.dataset.handled = 'true';
            stopLetterAnimation(letter);
            letter.remove();
        });
    }

    function animateLetter(letter) {
        const state = letter._animationState;
        if (!state) {
            return;
        }

        const step = (timestamp) => {
            if (state.removed) {
                return;
            }

            if (state.lastTimestamp === null) {
                state.lastTimestamp = timestamp;
            }
            const delta = timestamp - state.lastTimestamp;
            state.lastTimestamp = timestamp;

            if (isGamePaused) {
                state.frameId = requestAnimationFrame(step);
                return;
            }

            state.elapsed += delta;
            let x;
            let y;

            if (state.mode === 'fountain') {
                const t = state.elapsed;
                x = state.startX + state.vx * t;
                y = state.startY - state.vy * t + 0.5 * state.gravity * t * t;
                letter.style.left = `${x}px`;
                letter.style.top = `${y}px`;

                if (y > state.bottomThreshold || y < -LETTER_HEIGHT * 4 || x < state.leftThreshold || x > state.rightThreshold) {
                    handleLetterExit(letter);
                    return;
                }
            } else {
                const progress = state.elapsed / state.duration;
                const clampedProgress = Math.min(progress, 1);
                x = state.startX + (state.drift || 0) * clampedProgress;
                y = state.startY + state.totalDistance * clampedProgress;
                letter.style.left = `${x}px`;
                letter.style.top = `${y}px`;

                if (progress >= 1) {
                    handleLetterExit(letter);
                    return;
                }
            }

            state.frameId = requestAnimationFrame(step);
        };

        state.frameId = requestAnimationFrame(step);
    }

    function handleLetterExit(letter) {
        if (letter.dataset.handled !== 'true' && letter.dataset.shouldCatch === 'true') {
            registerMistake();
        }
        stopLetterAnimation(letter);
        if (letter.parentElement) {
            letter.remove();
        }
    }

    function stopLetterAnimation(letter) {
        const state = letter._animationState;
        if (!state) {
            return;
        }
        state.removed = true;
        if (state.frameId) {
            cancelAnimationFrame(state.frameId);
            state.frameId = null;
        }
    }

    function applyLevelTheme() {
        const color = LEVEL_COLORS[(currentLevel - 1) % LEVEL_COLORS.length];
        document.body.style.background = `linear-gradient(135deg, ${color} 0%, #ffffff 100%)`;
        gameArea.style.background = hexToRgba(color, 0.45);
    }

    function hexToRgba(hex, alpha = 1) {
        const sanitized = hex.replace('#', '');
        const bigint = parseInt(sanitized, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function startLetterInterval() {
        clearInterval(gameInterval);
        const intervalTime = 2000 / speed; // Faster speed = shorter interval
        gameInterval = setInterval(createLetter, intervalTime);
    }

    function restartLoopIfRunning() {
        if (!isGamePaused) {
            startLetterInterval();
        }
    }

    function updateSpeed(newSpeed, syncSlider = true) {
        const clamped = Math.max(MIN_SPEED, Math.min(MAX_SPEED, newSpeed));
        if (speed === clamped) {
            return;
        }
        speed = clamped;
        if (syncSlider) {
            speedSlider.value = speed;
        }
        restartLoopIfRunning();
    }

    function adjustSpeed(delta) {
        updateSpeed(speed + delta);
    }

    applyLevelTheme();
});
