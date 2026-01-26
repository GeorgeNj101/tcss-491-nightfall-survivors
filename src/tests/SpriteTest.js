const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 600;

// ----------------------
// KEY INPUT
// ----------------------
const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// ----------------------
// SPRITE INSTANCE
// ----------------------
const sprite = new Sprite("../assets/Main_Character.png");

// center sprite on screen
sprite.x = canvas.width / 2 - sprite.frameWidth / 2;
sprite.y = canvas.height / 2 - sprite.frameHeight / 2;

// ----------------------
// ANIMATION TIMING
// ----------------------
const FPS = 4;
const FRAME_TIME = 1000 / FPS;

let lastTime = 0;
let gameFrame = 0;

// ----------------------
// UPDATE MOVEMENT + DIRECTION
// ----------------------
function updateDirectionAndMovement() {
    let moving = false;

    if (keys["w"] || keys["ArrowUp"]) {
        sprite.setDirection(3); // backward
        moving = true;
    }
    if (keys["s"] || keys["ArrowDown"]) {
        sprite.setDirection(0); // forward
        moving = true;
    }
    if (keys["a"] || keys["ArrowLeft"]) {
        sprite.setDirection(2); // left
        moving = true;
    }
    if (keys["d"] || keys["ArrowRight"]) {
        sprite.setDirection(1); // right
        moving = true;
    }

    if (moving) sprite.startMoving();
    else sprite.stopMoving();
}

// ----------------------
// MAIN LOOP
// ----------------------
function animate(timestamp) {
    const delta = timestamp - lastTime;

    // advance animation at 4 FPS
    if (delta >= FRAME_TIME) {
        lastTime = timestamp;
        gameFrame++;
    }

    updateDirectionAndMovement();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // IMPORTANT: pass screenX and screenY
    const screenX = sprite.x;
    const screenY = sprite.y;

    sprite.draw(ctx, gameFrame, screenX, screenY);

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);