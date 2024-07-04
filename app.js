const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const $sprite = document.querySelector('#sprite');
const $sprites = document.querySelector('#sprites');
const $bricks = document.querySelector('#bricks');

// Función para ajustar el tamaño del canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
// Ajustar el tamaño del canvas al cargar la página
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

/* VARIABLES DEL MENU */
const $menuContainer = document.querySelector('#menu-container');
const $startButton = document.querySelector('#new-game');
const $backgroundSelwect = document.querySelector('#background');
const $customizeButton = document.querySelector('#customize-button');

/* VARIABLES DE LA PELOTA */
const ballRadius = 5;
let x = canvas.width / 2;
let y = canvas.height - 20;
let dx = -5;
let dy = -5;

/* VARIABLES DE LA PALETA */
const PADDLE_SENSITIVITY = 9;
const paddleHeight = 10;
const paddleWidth = 120;
let paddleX = (canvas.width - paddleWidth) / 2;
let paddleY = canvas.height - paddleHeight - 10;
let rightPressed = false;
let leftPressed = false;

/* VARIABLES DE LOS LADRILLOS */
const totalBrickWidth = 0.8 * canvas.width;
const totalBrickHeight = 0.4 * canvas.height;
const brickColumnCount = 18;
const brickRowCount = 9;
const brickPadding = totalBrickWidth * 0.05 / brickColumnCount;
const brickWidth = (totalBrickWidth - brickPadding * (brickColumnCount - 1)) / brickColumnCount;
const brickHeight = (totalBrickHeight - brickPadding * (brickRowCount - 1)) / brickRowCount;
const brickOffsetTop = 0.1 * canvas.height;
const brickOffsetLeft = (canvas.width - totalBrickWidth) / 2;
// const brickRowCount = 9;
// const brickColumnCount = 18;
// const brickWidth = 32;
// const brickHeight = 14;
// const brickPadding = 4;
// const brickOffsetTop = 70;
// const brickOffsetLeft = 5;
const bricks = [];

const BRICK_STATUS = {
    ACTIVE: 1,
    DESTROYED: 0
};

/* VARIABLES PARA EL MENU DE PAUSA */
const $pauseMenu = document.createElement('div');
$pauseMenu.id = 'pause-menu';
$pauseMenu.innerHTML = `
    <h2>Partida <span>Pausada</span></h2>
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
    <h2>¡Has <span>ganado</span> la partida!</h2>
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
    <h2>¡<span>Lástima</span>, inténtalo de nuevo!</h2>
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

/* Niveles del juego  */
const levels = [
    // Nivel 1
    [
        [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
        [1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0],
        [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0],
        [1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1]
    ],
    // Nivel 2
    [
        [1, 0, 1, 0, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 0, 1, 0]
    ],
    // Otros niveles...
];

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

/* FUNCIONES DEL JUEGO */
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    // const spriteWidth = 46; // Ancho original de la imagen del paddle en el sprite
    // const spriteHeight = 1; // Altura original de la imagen del paddle en el sprite
    const spriteWidth = 585; // Ancho original de la imagen del paddle en el sprite
    const spriteHeight = 210; // Altura original de la imagen del paddle en el sprite
    const scaleX = paddleWidth / spriteWidth; // Factor de escala para el ancho
    const scaleY = paddleHeight / spriteHeight; // Factor de escala para la altura

    ctx.drawImage(
        $sprite,
        0, // Posición x en el sprite
        0, // Posición y en el sprite
        spriteWidth, // Ancho original en el sprite
        spriteHeight, // Altura original en el sprite
        paddleX, // Posición x en el canvas
        paddleY, // Posición y en el canvas
        paddleWidth, // Ancho en el canvas (escala según el tamaño del paddle)
        paddleHeight // Altura en el canvas (escala según el tamaño del paddle)
    );
}


function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const currentBrick = bricks[c][r];
            if (currentBrick.status === BRICK_STATUS.DESTROYED) continue;

            const clipX = currentBrick.color * 32;

            ctx.drawImage(
                $sprite,
                clipX,
                100,
                brickWidth * 3.5,
                brickHeight * 1.5,
                currentBrick.x,
                currentBrick.y,
                brickWidth,
                brickHeight
            );
        }
    }
}

// function drawUI() {
//     ctx.fillText(`FPS: ${framesPerSec}`, 5, 10);
// }

function collisionDetection() {
    let counter = 1;
    do {

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

                if (distX < halfBrickWidth + halfBallWidth && distY < halfBrickHeight + halfBallHeight && $counter < 2) {
                    counter++;
                    currentBrick.status = BRICK_STATUS.DESTROYED;
                    updateScore(10); // Incrementa la puntuación en 10 puntos por cada ladrillo destruido
                    checkGameEnd();

                    const overlapX = halfBrickWidth + halfBallWidth - distX;
                    const overlapY = halfBrickHeight + halfBallHeight - distY;

                    if (overlapX >= overlapY) {
                        dy = -dy;
                        dx = dx;
                    } else {
                        dx = -dx;
                        dy = dy;
                    }
                }
            }
        }
    } while ($counter = 0)
}
// Función para copiar el estado actual de los ladrillos
function copyBricksState() {
    let copiedBricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        copiedBricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            copiedBricks[c][r] = { ...bricks[c][r] }; // Copiar cada objeto ladrillo (importante para no modificar el original)
        }
    }
    return copiedBricks;
}
// Función para dibujar los ladrillos en el canvas usando la variable copiada
function drawBricksCopy(copiedBricks) {
    const brickWidth = 75;
    const brickHeight = 20;
    const brickPadding = 10;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 30;

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (copiedBricks[c][r].status === 'active') {

                const clipX = currentBrick.color * 32;

                ctx.drawImage(
                    $sprite,
                    clipX,
                    100,
                    brickWidth * 3.5,
                    brickHeight * 1.5,
                    currentBrick.x,
                    currentBrick.y,
                    brickWidth,
                    brickHeight
                );
            }
        }
    }
}


function draw() {

    $victoryMessage.classList.add("hidden")
    $looseMessage.classList.add("hidden")
    $menuContainer.classList.add("hidden")

    animationId = window.requestAnimationFrame(draw);

    // const msNow = window.performance.now();
    // const msPassed = msNow - msPrev;

    // if (msPassed < msPerFrame) return;

    // const excessTime = msPassed % msPerFrame;
    // msPrev = msNow - excessTime;

    // frames++;

    // if (msFPSPrev < msNow) {
    //     msFPSPrev = window.performance.now() + 1000;
    //     framesPerSec = frames;
    //     frames = 0;
    // }

    cleanCanvas();
    drawBall();
    drawPaddle();
    drawBricks();
    // drawUI();
    drawScore();

    collisionDetection();
    ballMovement();
    paddleMovement();

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

// Mostrar el menú al inicio
$menuContainer.classList.remove('hidden');

// Eventos del menú
$startButton.addEventListener('click', function () {
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

/* FUNCIONES DEL JUEGO */

function startGame() {
    // Ocultar el menú principal al iniciar el juego
    $menuContainer.classList.add('hidden');
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

    gamePaused = false;
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
// Eventos de táctiles
let touchStartX = null;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    // Ajusta la posición de la paleta basada en el movimiento táctil
    paddleX = touch.clientX - canvas.offsetLeft - paddleWidth / 2;
    // Asegúrate de que la paleta no se salga del canvas
    if (paddleX < 0) {
        paddleX = 0;
    }
    if (paddleX > canvas.width - paddleWidth) {
        paddleX = canvas.width - paddleWidth;
    }
});

canvas.addEventListener('touchend', () => {
    touchStartX = null;
});

function pauseGame() {
    gamePaused = true;
    $pauseMenu.style.display = 'block';
    cancelAnimationFrame(animationId);
    // Copiar estado actual de los ladrillos
    let copiedBricks = copyBricksState();
    // Dibujar los ladrillos en el canvas usando la variable copiada
    drawBricksCopy(copiedBricks);
    initEvents();
}

function resumeGame() {
    gamePaused = false;
    $pauseMenu.style.display = 'none';
    animationId = requestAnimationFrame(draw);
    drawBricks();
    drawBall();
    // Copiar estado actual de los ladrillos
    let copiedBricks = copyBricksState();
    // Dibujar los ladrillos en el canvas usando la variable copiada
    drawBricksCopy(copiedBricks);
    initEvents();
}

function quitToMenu() {
    $victoryMessage.style.display = 'none';
    $looseMessage.style.display = 'none';
    $pauseMenu.style.display = 'none';
    $menuContainer.classList.remove('hidden');
    gamePaused = false;
    cancelAnimationFrame(animationId);

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

    paddleX = (canvas.width - paddleWidth) / 2;

    // Reiniciar el estado de los ladrillos
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = BRICK_STATUS.ACTIVE;
        }
    }
}

// const fps = 60;
// let msPrev = window.performance.now();
// let msFPSPrev = window.performance.now() + 1000;
// const msPerFrame = 1000 / fps;
// let frames = 0;
// let framesPerSec = fps;



quitToMenu();
initEvents();