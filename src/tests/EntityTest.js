const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scaleX = 1600
const scaleY = 900

canvas.width = 1600;
canvas.height = 900;

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
const SpawnTime = 10 * FPS;

let lastTime = 0;
let gameFrame = 0;

let Entities = [new Entity("../assets/Chciken_Enemy.png")];

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

    Entities.forEach(entity => {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const dx = centerX - entity.X;
        const dy = centerY - entity.Y;

        const angle = Math.atan2(dy, dx);

        if (angle > -Math.PI/4 && angle <= Math.PI/4) {
            entity.setDirection(1); // right
        } else if (angle > Math.PI/4 && angle <= 3*Math.PI/4) {
            entity.setDirection(0); // forward
        } else if (angle <= -Math.PI/4 && angle > -3*Math.PI/4) {
            entity.setDirection(3); // backward
        } else {
            entity.setDirection(2); // left
        }
        entity.startMoving();

        entity.move(1)

        if(moving){
            entity.moveInDirection(2,(3-sprite.direction) % 4)
        }
    });
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

    if(gameFrame % SpawnTime === 0 && Entities.length < 30) {
        Entities.push(new Entity("../assets/Chciken_Enemy.png"))
        Entities.sort((a, b) => a.compare(b));
    }

    updateDirectionAndMovement();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // IMPORTANT: pass screenX and screenY
    const screenX = sprite.x;
    const screenY = sprite.y;

    sprite.draw(ctx, gameFrame, screenX, screenY);
    Entities.forEach(entity => {entity.draw(ctx, gameFrame);})
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);