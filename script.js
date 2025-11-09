document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const gameArea = document.getElementById('game-area');
    const scoreDisplay = document.getElementById('score');
    const mistakesDisplay = document.getElementById('mistakes');
    const levelDisplay = document.getElementById('level');
    const gameModeSelect = document.getElementById('game-mode');
    const speedSlider = document.getElementById('speed-slider');
    const startPauseBtn = document.getElementById('start-pause-btn');

    // Game State
    let score = 0;
    let levelMistakes = 0;
    let levelCorrect = 0;
    let currentLevel = 1;
    let gameMode = 'vowels'; // 'vowels' or 'consonants'
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

    // Speed Change
    speedSlider.addEventListener('input', (e) => {
        updateSpeed(parseInt(e.target.value, 10), false);
    });

    // --- Game Logic ---

    function createLetter() {
        const letter = document.createElement('div');
        letter.classList.add('letter', 'falling');
        
        const char = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        letter.textContent = char;
        const isVowel = VOWELS.includes(char.toUpperCase());
        const shouldCatch = (gameMode === 'vowels' && isVowel) || (gameMode === 'consonants' && !isVowel);
        letter.dataset.shouldCatch = shouldCatch ? 'true' : 'false';
        letter.dataset.handled = 'false';

        // Set random starting position and animation duration
        const gameAreaWidth = gameArea.clientWidth;
        const letterWidth = 60; // Approximate width of a letter element
        const startX = Math.random() * (gameAreaWidth - letterWidth);
        const animationDuration = (11 - speed) * 1.5; // Slower speed = longer duration

        letter.style.left = `${startX}px`;
        letter.style.top = '-50px'; // Start above the game area
        letter.style.animationDuration = `${animationDuration}s`;
        letter.style.animationPlayState = isGamePaused ? 'paused' : 'running';


        // Handle click/touch events
        const handleInteraction = () => {
            letter.dataset.handled = 'true';
            checkHit(letter, char);
            letter.removeEventListener('mousedown', handleInteraction);
            letter.removeEventListener('touchstart', handleInteraction);
        };

        letter.addEventListener('mousedown', handleInteraction);
        letter.addEventListener('touchstart', handleInteraction);

        gameArea.appendChild(letter);

        // Clean up letters that go off-screen
        setTimeout(() => {
            if (letter.parentElement) {
                if (letter.dataset.handled !== 'true' && letter.dataset.shouldCatch === 'true') {
                    registerMistake();
                }
                letter.remove();
            }
        }, animationDuration * 1000);
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
        setLetterAnimationState(false);

        startLetterInterval();
    }

    function pauseGame() {
        isGamePaused = true;
        startPauseBtn.textContent = '▶';
        startPauseBtn.classList.add('start-btn');
        startPauseBtn.classList.remove('paused');
        gameArea.classList.add('game-paused');
        setLetterAnimationState(true);
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
            letter.remove();
        });
    }

    function setLetterAnimationState(paused) {
        const state = paused ? 'paused' : 'running';
        const letters = gameArea.querySelectorAll('.letter');
        letters.forEach(letter => {
            letter.style.animationPlayState = state;
        });
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
