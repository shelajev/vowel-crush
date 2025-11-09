document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const gameArea = document.getElementById('game-area');
    const scoreDisplay = document.getElementById('score');
    const mistakesDisplay = document.getElementById('mistakes');
    const gameModeSelect = document.getElementById('game-mode');
    const speedSlider = document.getElementById('speed-slider');
    const startPauseBtn = document.getElementById('start-pause-btn');

    // Game State
    let score = 0;
    let mistakes = 0;
    let gameMode = 'vowels'; // 'vowels' or 'consonants'
    let speed = 3; // Corresponds to slider value
    let gameInterval;
    let isGamePaused = true;

    // Alphabets and Vowels
    const VOWELS = ['A', 'E', 'I', 'O', 'U', 'Õ', 'Ä', 'Ö', 'Ü'];
    const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'Š', 'Z', 'Ž', 'T', 'V', 'W', 'X', 'Y'];
    const ALPHABET = [...VOWELS, ...CONSONANTS];

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
        speed = parseInt(e.target.value, 10);
        if (!isGamePaused) {
            // Adjust game loop speed without a full reset
            clearInterval(gameInterval);
            startGame();
        }
    });

    // --- Game Logic ---

    function createLetter() {
        const letter = document.createElement('div');
        letter.classList.add('letter', 'falling');
        
        const char = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        letter.textContent = char;

        // Set random starting position and animation duration
        const gameAreaWidth = gameArea.clientWidth;
        const letterWidth = 60; // Approximate width of a letter element
        const startX = Math.random() * (gameAreaWidth - letterWidth);
        const animationDuration = (11 - speed) * 1.5; // Slower speed = longer duration

        letter.style.left = `${startX}px`;
        letter.style.top = '-50px'; // Start above the game area
        letter.style.animationDuration = `${animationDuration}s`;


        // Handle click/touch events
        const handleInteraction = () => {
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
            score++;
            scoreDisplay.textContent = score;
            letterElement.style.backgroundColor = '#2ecc71'; // Green for correct
        } else {
            mistakes++;
            mistakesDisplay.textContent = mistakes;
            letterElement.style.backgroundColor = '#e74c3c'; // Red for incorrect
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
        mistakes = 0;
        scoreDisplay.textContent = score;
        mistakesDisplay.textContent = mistakes;
        
        // Remove all letter elements, but keep the button
        const letters = gameArea.querySelectorAll('.letter');
        letters.forEach(letter => letter.remove());

        clearInterval(gameInterval);
        pauseGame(true); // Go to a paused state without toggling
    }

    function startGame() {
        isGamePaused = false;
        startPauseBtn.textContent = '❚❚';
        startPauseBtn.classList.remove('start-btn');
        startPauseBtn.classList.add('paused');
        gameArea.classList.remove('game-paused');

        const intervalTime = 2000 / speed; // Faster speed = shorter interval
        gameInterval = setInterval(createLetter, intervalTime);
    }

    function pauseGame(isReset = false) {
        isGamePaused = true;
        startPauseBtn.textContent = '▶';
        startPauseBtn.classList.add('start-btn');
        startPauseBtn.classList.remove('paused');
        gameArea.classList.add('game-paused');
        clearInterval(gameInterval);
    }
});
