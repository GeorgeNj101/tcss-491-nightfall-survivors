const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = canvas.width = 600;
const CANVAS_HEIGHT = canvas.height = 600;

let frameX = 0;
let frameY = 0;
let gameFrame = 0;


const playerImage = new Image();
playerImage.src = '../assets/sprite_example.png';

const player = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    spriteWidth: 575,
    spriteHeight: 523,
    width: 100,
    height: 100,
    speed: 5
};

const camera = {
    x: 0,
    y: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT
};

function updateCamera() {
	if (keys["w"] || keys["ArrowUp"]) camera.y -= player.speed;
  if (keys["s"] || keys["ArrowDown"]) camera.y += player.speed;
  if (keys["a"] || keys["ArrowLeft"]) camera.x -= player.speed;
  if (keys["d"] || keys["ArrowRight"]) camera.x += player.speed;
}

const keys = {};

document.addEventListener('keydown', function(e) {
	keys[e.key] = true;
});

document.addEventListener('keyup', function(e) {
	keys[e.key] = false;
});

function drawGrid() {
  const tileSize = 100;
  ctx.strokeStyle = "#666";

  const startX = -tileSize + (-camera.x % tileSize);
  const startY = -tileSize + (-camera.y % tileSize);

  for (let x = startX; x < canvas.width; x += tileSize) {
    for (let y = startY; y < canvas.height; y += tileSize) {
      ctx.strokeRect(x, y, tileSize, tileSize);
    }
  }
}

function drawPlayer() {
	const screenX = CANVAS_WIDTH / 2 - player.width / 2;
	const screenY = CANVAS_HEIGHT / 2 - player.height / 2;

	// Check if any movement key is pressed (arrow keys or WASD)
	const isMoving = keys["ArrowUp"] || keys["ArrowDown"] || keys["ArrowLeft"] || keys["ArrowRight"] ||
	                 keys["w"] || keys["s"] || keys["a"] || keys["d"];

	if (isMoving) {
		// Use row 2 (index 1) for movement animation
		frameY = 1;
		// Cycle through animation frames (assuming 6 frames per row)
		frameX = Math.floor(gameFrame / 5) % 6;
	} else {
		// Idle state - use row 1 (index 0)
		frameY = 0;
		frameX = 0;
	}

	ctx.drawImage(playerImage, frameX * player.spriteWidth, frameY * player.spriteHeight, player.spriteWidth, player.spriteHeight, screenX, screenY, player.width, player.height);

	gameFrame++;
}

function animate() {

    
		updateCamera();

		ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		// Draw grid (temporary - remove later)
    drawGrid();
		drawPlayer();
		
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
