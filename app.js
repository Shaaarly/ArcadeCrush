const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const $sprite = document.querySelector('#sprite');
const $bricks = document.querySelector('#bricks');

canvas.width = 620;
canvas.height = 500;

/* VARIABLES DEL MENU */
const $menuContainer = document.querySelector('#menu-container');
const $startButton = document.querySelector('#start-button');
const $difficultySelect = document.querySelector('#difficulty');
const $backgroundSelect = document.querySelector('#background');
const $customizeButton = document.querySelector('#customize-button');

/* VARIABLES DE LA PELOTA */
const ballRadius = 4;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = -3;
let dy = -3;

/* VARIABLES DE LA PALETA */
const PADDLE_SENSITIVITY = 8;
const paddleHeight = 10;
const paddleWidth = 50;
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleY = canvas.height - paddleHeight - 10;
let rightPressed = false;
let leftPressed = false;

/* VARIABLES DE LOS LADRILLOS */
const brickRowCount = 6;
const brickColumnCount = 15;
const brickWidth = 32;
const brickHeight = 14;
const brickPadding = 2;
const brickOffsetTop = 70;
const brickOffsetLeft = 60;
const bricks = [];

const BRICK_STATUS = {
    ACTIVE: 1,
    DESTROYED: 0
};

/* VARIABLES PARA EL MENU DE PAUSA */
const $pauseMenu = document.createElement('div');
$pauseMenu.id = 'pause-menu';
$pauseMenu.innerHTML = `
    <h2>Game Paused</h2>
    <button id="resume-button" class="boton">Reanudar</button>
    <button id="quit-button"  class="boton">Salir al Menú</button>
`;
document.body.appendChild($pauseMenu);

const $resumeButton = document.querySelector('#resume-button');
const $quitButton = document.querySelector('#quit-button');

/* VARIABLES PARA EL MENSAJE DE VICTORIA */
const $victoryMessage = document.createElement('div');
$victoryMessage.classList.add('pause-menu');
$victoryMessage.id = 'victory-message';
$victoryMessage.innerHTML = `
    <h2>¡Has ganado la partida!</h2>
    <button id="play-again-button">Jugar de nuevo</button>
    <button id="main-menu-button">Ir al menú principal</button>
`;
$victoryMessage.style.display = 'none'; // Ocultar mensaje al inicio
document.body.appendChild($victoryMessage);

/* VARIABLES PARA EL MENSAJE DE DERROTA */
const $looseMessage = document.createElement('div');
$looseMessage.classList.add('pause-menu');
$looseMessage.id = 'loose-message';
$looseMessage.innerHTML = `
    <h2>¡Lástima, inténtalo de nuevo!</h2>
    <button id="play-again-button-loose" class="boton">Jugar de nuevo</button>
    <button id="main-menu-button-loose" class="boton">Ir al menú principal</button>
`;
$looseMessage.style.display = 'none'; // Ocultar mensaje al inicio
document.body.appendChild($looseMessage);

const $playAgainButton = document.querySelector('#play-again-button');
const $mainMenuButton = document.querySelector('#main-menu-button');
const $playAgainButtonLoose = document.querySelector('#play-again-button-loose');
const $mainMenuButtonLoose = document.querySelector('#main-menu-button-loose');

let gamePaused = false;
let animationId;

/* VARIABLES PARA EL SCORE */
let score = 0;
const $scoreDisplay = document.createElement('div');
$scoreDisplay.id = 'score';
$scoreDisplay.innerHTML = `Score: ${score}`;
document.body.appendChild($scoreDisplay);

function updateScore(points) {
    score += points;
    $scoreDisplay.innerHTML = `Score: ${score}`;
}


// Mostrar el menú al inicio
$menuContainer.classList.remove('hidden');

// Eventos del menú
$startButton.addEventListener('click', startGame);

// Eventos para la pausa
document.addEventListener('keydown', keyDownHandler);

$resumeButton.addEventListener('click', resumeGame);
$quitButton.addEventListener('click', quitToMenu);
$playAgainButton.addEventListener('click', playAgain);
$mainMenuButton.addEventListener('click', quitToMenu);
$playAgainButtonLoose.addEventListener('click', playAgain);
$mainMenuButtonLoose.addEventListener('click', quitToMenu);

/* FUNCIONES DEL JUEGO */

function startGame() {
    $menuContainer.classList.add('hidden');
    $victoryMessage.classList.add('hidden');
    $looseMessage.classList.add('hidden');
    gamePaused = false;
    resetGame();
    animationId = requestAnimationFrame(draw);
}

function keyDownHandler(event) {
    const { key } = event;
    if (key === 'Escape') {
        if (!gamePaused) {
            pauseGame();
        } else {
            resumeGame();
        }
    } else if (key === 'Right' || key === 'ArrowRight' || key.toLowerCase() === 'd') {
        rightPressed = true;
    } else if (key === 'Left' || key === 'ArrowLeft' || key.toLowerCase() === 'a') {
        leftPressed = true;
    }
}

function keyUpHandler(event) {
    const { key } = event;
    if (key === 'Right' || key === 'ArrowRight' || key.toLowerCase() === 'd') {
        rightPressed = false;
    } else if (key === 'Left' || key === 'ArrowLeft' || key.toLowerCase() === 'a') {
        leftPressed = false;
    }
}

function pauseGame() {
    gamePaused = true;
    $pauseMenu.style.display = 'block';
    cancelAnimationFrame(animationId);
}

function resumeGame() {
    gamePaused = false;
    $pauseMenu.style.display = 'none';
    animationId = requestAnimationFrame(draw);
}

function quitToMenu() {
    $victoryMessage.style.display = 'none';
    $looseMessage.style.display = 'none';
    $pauseMenu.style.display = 'none';
    $menuContainer.classList.remove('hidden');
    gamePaused = false;
    cancelAnimationFrame(animationId);
}

function playAgain() {
    $victoryMessage.style.display = 'none';
    $looseMessage.style.display = 'none';
    startGame();
}

function showMessage(message) {
    gamePaused = true;
    cancelAnimationFrame(animationId);
    if (message === 'victory') {
        $victoryMessage.style.display = 'block';
    } else if (message === 'loose') {
        $looseMessage.style.display = 'block';
    }
}

function checkGameEnd() {
    let bricksLeft = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === BRICK_STATUS.ACTIVE) {
                bricksLeft++;
            }
        }
    }
    if (bricksLeft === 0) {
        showMessage('victory');
    }
}

for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        const random = Math.floor(Math.random() * 8);
        bricks[c][r] = {
            x: brickX,
            y: brickY,
            status: BRICK_STATUS.ACTIVE,
            color: random
        };
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.drawImage(
        $sprite,
        29,
        174,
        paddleWidth,
        paddleHeight,
        paddleX,
        paddleY,
        paddleWidth,
        paddleHeight
    );
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const currentBrick = bricks[c][r];
            if (currentBrick.status === BRICK_STATUS.DESTROYED) continue;

            const clipX = currentBrick.color * 32;

            ctx.drawImage(
                $bricks,
                clipX,
                0,
                brickWidth,
                brickHeight,
                currentBrick.x,
                currentBrick.y,
                brickWidth,
                brickHeight
            );
        }
    }
}

function drawUI() {
    ctx.fillText(`FPS: ${framesPerSec}`, 5, 10);
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const currentBrick = bricks[c][r];
            if (currentBrick.status === BRICK_STATUS.DESTROYED) continue;

            const ballCenterX = x;
            const ballCenterY = y;
            const brickCenterX = currentBrick.x + brickWidth / 2;
            const brickCenterY = currentBrick.y + brickHeight / 2;
            const distX = Math.abs(ballCenterX - brickCenterX);
            const distY = Math.abs(ballCenterY - brickCenterY);
            const halfBrickWidth = brickWidth / 2;
            const halfBrickHeight = brickHeight / 2;
            const halfBallWidth = ballRadius;
            const halfBallHeight = ballRadius;

            if (distX <= halfBrickWidth + halfBallWidth && distY <= halfBrickHeight + halfBallHeight) {
                currentBrick.status = BRICK_STATUS.DESTROYED;
                updateScore(10); // Incrementa la puntuación en 10 puntos por cada ladrillo destruido
                checkGameEnd();

                const overlapX = halfBrickWidth + halfBallWidth - distX;
                const overlapY = halfBrickHeight + halfBallHeight - distY;

                if (overlapX >= overlapY) {
                    dy = -dy;
                } else {
                    dx = -dx;
                }
            }
        }
    }
}


function ballMovement() {
    x += dx;
    y += dy;

    // Colisión con los bordes laterales
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }

    // Colisión con el borde superior
    if (y + dy < ballRadius) {
        dy = -dy;
    }

    // Colisión con la paleta
    if (y + dy > canvas.height - ballRadius - paddleHeight) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
        } else {
            // Si la pelota toca la parte inferior sin colisionar con la paleta
            showMessage('loose');
            $looseMessage.style.display = 'block'; // Mostrar el mensaje de derrota
            cancelAnimationFrame(animationId); // Detener la animación del juego
            return; // Salir de la función ballMovement()
        }
    }
}

function paddleMovement() {
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += PADDLE_SENSITIVITY;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= PADDLE_SENSITIVITY;
    }
}

function cleanCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function initEvents() {
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
}

function resetGame() {
    $looseMessage.classList.add("hidden");
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = -3;
    dy = -3;

    paddleX = (canvas.width - paddleWidth) / 2;

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = BRICK_STATUS.ACTIVE;
        }
    }
}

const fps = 60;
let msPrev = window.performance.now();
let msFPSPrev = window.performance.now() + 1000;
const msPerFrame = 1000 / fps;
let frames = 0;
let framesPerSec = fps;

function draw() {
    if (gamePaused) return;

    $victoryMessage.classList.add("hidden")
    $looseMessage.classList.add("hidden")
    $menuContainer.classList.add("hidden")

    animationId = window.requestAnimationFrame(draw);

    const msNow = window.performance.now();
    const msPassed = msNow - msPrev;

    if (msPassed < msPerFrame) return;

    const excessTime = msPassed % msPerFrame;
    msPrev = msNow - excessTime;

    frames++;

    if (msFPSPrev < msNow) {
        msFPSPrev = window.performance.now() + 1000;
        framesPerSec = frames;
        frames = 0;
    }

    cleanCanvas();
    drawBall();
    drawPaddle();
    drawBricks();
    drawUI();

    collisionDetection();
    ballMovement();
    paddleMovement();
}


draw();
initEvents();
$menuContainer.classList.remove('hidden');
