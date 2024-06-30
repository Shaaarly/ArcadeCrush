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
const difficulty = 'easy';

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
    <h2>Partida Pausada</h2>
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
    <button id="play-again-button" class="boton">Jugar de nuevo</button>
    <button id="main-menu-button" class="boton">Ir al menú principal</button>
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
$scoreDisplay.classList.add('score');
$scoreDisplay.innerHTML = `Score: ${score}`;

function updateScore(points) {
    score += points;
    $scoreDisplay.innerHTML = `Score: ${score}`;
}
function drawScore() {
    const cornerRadius = 5; // Radio de la esquina para el borde redondeado

    // Definir el estilo del fondo
    ctx.fillStyle = 'rgb(156, 0, 156)'; // Color del fondo

    // Dibujar el fondo con bordes redondeados detrás del texto
    const textWidth = ctx.measureText(`Score: ${score}`).width;
    const backgroundX = (canvas.width / 2) - 5;
    const backgroundY = 20 - 16;
    const backgroundWidth = textWidth + 10;
    const backgroundHeight = 16 + 5;

    ctx.beginPath();
    ctx.moveTo(backgroundX + cornerRadius, backgroundY);
    ctx.lineTo(backgroundX + backgroundWidth - cornerRadius, backgroundY);
    ctx.arcTo(backgroundX + backgroundWidth, backgroundY, backgroundX + backgroundWidth, backgroundY + cornerRadius, cornerRadius);
    ctx.lineTo(backgroundX + backgroundWidth, backgroundY + backgroundHeight - cornerRadius);
    ctx.arcTo(backgroundX + backgroundWidth, backgroundY + backgroundHeight, backgroundX + backgroundWidth - cornerRadius, backgroundY + backgroundHeight, cornerRadius);
    ctx.lineTo(backgroundX + cornerRadius, backgroundY + backgroundHeight);
    ctx.arcTo(backgroundX, backgroundY + backgroundHeight, backgroundX, backgroundY + backgroundHeight - cornerRadius, cornerRadius);
    ctx.lineTo(backgroundX, backgroundY + cornerRadius);
    ctx.arcTo(backgroundX, backgroundY, backgroundX + cornerRadius, backgroundY, cornerRadius);
    ctx.closePath();

    ctx.fill();

    // Dibujar el texto del puntaje
    ctx.font = '16px Arial';
    ctx.fillStyle = '#fff'; // Color del texto blanco
    ctx.fillText(`Score: ${score}`, (canvas.width / 2), 20); // Ajusta la posición según tus necesidades
}



// Mostrar el menú al inicio
$menuContainer.classList.remove('hidden');

// Eventos del menú
$startButton.addEventListener('click', function () {
    // Ocultar el menú principal al iniciar el juego
    $menuContainer.classList.add('hidden');
    startGame();
});


// Eventos para la pausa
document.addEventListener('keydown', keyDownHandler);

$resumeButton.addEventListener('click', resumeGame);
$quitButton.addEventListener('click', quitToMenu);
$playAgainButton.addEventListener('click', startGame);
$mainMenuButton.addEventListener('click', quitToMenu);
$playAgainButtonLoose.addEventListener('click', startGame);
$mainMenuButtonLoose.addEventListener('click', quitToMenu);
$difficultySelect.addEventListener('change', function () {
    const difficulty = $difficultySelect.value;

    switch (difficulty) {
        case 'easy':
            dx = -3;
            dy = -3;
            break;
        case 'medium':
            dx = -5;
            dy = -5;
            break;
        case 'hard':
            dx = -7;
            dy = -7;
            break;
        default:
            dx = -3;
            dy = -3;
            break;
    }
});


/* FUNCIONES DEL JUEGO */

function startGame() {
    // Hide victory and defeat messages
    $victoryMessage.style.display = 'none';
    $looseMessage.style.display = 'none';

    // Reset score
    score = 0;
    $scoreDisplay.innerHTML = `Score: ${score}`;

    // Reset bricks
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = BRICK_STATUS.ACTIVE;
        }
    }

    // Reset ball and paddle positions
    x = canvas.width / 2;
    y = canvas.height - 30;
    paddleX = (canvas.width - paddleWidth) / 2;

    // Restart animation loop
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
            // Calcular el punto de impacto relativo en la paleta
            const impactPoint = x - (paddleX + paddleWidth / 2);
            // Normalizar el impacto para obtener un valor entre -1 y 1
            const normalizedImpact = impactPoint / (paddleWidth / 2);
            // Definir el ángulo de rebote basado en el punto de impacto
            const angle = normalizedImpact * Math.PI / 3; // Ángulo máximo de 60 grados

            // Calcular la velocidad original
            const speed = Math.sqrt(dx * dx + dy * dy);

            // Modificar la dirección x y y basado en el ángulo calculado
            dx = Math.sin(angle) * speed;
            dy = -Math.cos(angle) * speed;
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
    // Resetear las posiciones y estados del juego
    x = canvas.width / 2;
    y = canvas.height - 30;
    switch (difficulty) {
        case 'easy':
            dx = -3;
            dy = -3;
            break;
        case 'medium':
            dx = -5;
            dy = -5;
            break;
        case 'hard':
            dx = -7;
            dy = -7;
            break;
        default:
            dx = -3;
            dy = -3;
            break;
    }

    paddleX = (canvas.width - paddleWidth) / 2;

    // Reiniciar el estado de los ladrillos
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
    if (gamePaused) {
        return;
    } else {
        if (!gamePaused) {

        }
    }

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
    drawScore();

    collisionDetection();
    ballMovement();
    paddleMovement();
}

$menuContainer.classList.remove('hidden');
draw();
initEvents();