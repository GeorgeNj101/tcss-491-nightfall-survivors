const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scaleX = 1600;
const scaleY = 900;

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
const sprite = new Sprite("assets/Main_Character.png");

// center sprite on screen
sprite.x = canvas.width / 2 - sprite.frameWidth / 2;
sprite.y = canvas.height / 2 - sprite.frameHeight / 2;

// Add health
sprite.health = 100;
sprite.maxHealth = 100;

// Death state
let isDead = false;
let deathTime = 0;

// ----------------------
// ANIMATION TIMING
// ----------------------
const FPS = 4;
const FRAME_TIME = 1000 / FPS;
const SpawnTime = 10 * FPS;

let lastTime = 0;
let gameFrame = 0;

let Entities = [new Entity("assets/Chicken_Enemy.png")];

let tileOffsetX = 0;
let tileOffsetY = 0;
const tileSize = 64;

// ----------------------
// UPDATE MOVEMENT + DIRECTION
// ----------------------
function updateDirectionAndMovement() {
    if (isDead) return;

    let moving = false;

    Entities.sort((a, b) => a.compare(b));

    if (keys["w"] || keys["ArrowUp"]) {
        sprite.setDirection(3);
        moving = true;
        tileOffsetY += 2;
    }
    if (keys["s"] || keys["ArrowDown"]) {
        sprite.setDirection(0);
        moving = true;
        tileOffsetY -= 2;
    }
    if (keys["a"] || keys["ArrowLeft"]) {
        sprite.setDirection(2);
        moving = true;
        tileOffsetX += 2;
    }
    if (keys["d"] || keys["ArrowRight"]) {
        sprite.setDirection(1);
        moving = true;
        tileOffsetX -= 2;
    }

    tileOffsetX %= tileSize;
    tileOffsetY %= tileSize;

    if (moving) sprite.startMoving();
    else sprite.stopMoving();

    let tempEntities = [...Entities];

    Entities.forEach(entity => {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const dx = centerX - entity.X;
        const dy = centerY - entity.Y;

        let angle = Math.atan2(dy, dx);
        if (gameFrame % FPS === 0) {
            if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
                entity.setDirection(1);
            } else if (angle > Math.PI / 4 && angle <= 3 * Math.PI / 4) {
                entity.setDirection(0);
            } else if (angle <= -Math.PI / 4 && angle > -3 * Math.PI / 4) {
                entity.setDirection(3);
            } else {
                entity.setDirection(2);
            }
        }

        entity.startMoving();

        if (moving) {
            entity.moveInDirection(2, (3 - sprite.direction) % 4);
        }

        // Collision with player
        if (
            entity.X >= sprite.x - sprite.frameWidth / 2 &&
            entity.X <= sprite.x + sprite.frameWidth / 2 &&
            entity.Y >= sprite.y - sprite.frameHeight / 2 &&
            entity.Y <= sprite.y + sprite.frameHeight / 2
        ) {
            const dx = entity.X - sprite.x;
            const dy = entity.Y - sprite.y;

            let enemyAngleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

            const facingAnglesDeg = [90, 0, 180, -90];
            let playerFacingDeg = facingAnglesDeg[sprite.direction];

            let diffDeg = enemyAngleDeg - playerFacingDeg;
            diffDeg = ((diffDeg + 180) % 360) - 180;

            const attackAngleDeg = 100;

            if (Math.abs(diffDeg) <= attackAngleDeg / 2) {
                tempEntities = tempEntities.filter(temp => temp !== entity);
            } else if (gameFrame % FPS === 0) {
                sprite.health -= 5;
                if (sprite.health < 0) sprite.health = 0;
            }
        }

        entity.move(1);
    });

    Entities = tempEntities;
}

// ----------------------
// DRAW DEATH SCREEN
// ----------------------
function drawDeathScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "80px Arial";
    ctx.textAlign = "center";
    ctx.fillText("YOU DIED", canvas.width / 2, canvas.height / 2 - 50);

    ctx.font = "40px Arial";
    ctx.fillText(`Survived: ${Math.floor(deathTime / FPS)} seconds`, canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = "30px Arial";
    ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 80);
}

// Restart on R
document.addEventListener("keydown", e => {
    if (isDead && e.key.toLowerCase() === "r") {
        location.reload();
    }
});

// ----------------------
// MAIN LOOP
// ----------------------
function animate(timestamp) {
    const delta = timestamp - lastTime;

    if (!isDead && delta >= FRAME_TIME) {
        lastTime = timestamp;
        gameFrame++;
    }

    // Check for death
    if (!isDead && sprite.health <= 0) {
        isDead = true;
        deathTime = gameFrame;
    }

    if (!isDead && gameFrame % SpawnTime === 0 && Entities.length < 30) {
        Entities.push(new Entity("assets/Chicken_Enemy.png"));
    }

    updateDirectionAndMovement();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawTiles();

    // ----------------------
    // PLAYER HEALTH BAR
    // ----------------------
    const barWidth = 200;
    const barHeight = 20;
    const barX = 20;
    const barY = 20;

    ctx.fillStyle = "#550000";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const healthPercent = sprite.health / sprite.maxHealth;
    ctx.fillStyle = "red";
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        `${Math.floor(sprite.health)} / ${sprite.maxHealth}`,
        barX + barWidth / 2,
        barY + barHeight - 4
    );

    // ----------------------
    // DRAW PLAYER + ENTITIES
    // ----------------------
    const screenX = sprite.x;
    const screenY = sprite.y;

    drawn = false;

    Entities.forEach(entity => {
        if (!drawn) {
            if (entity.Y > sprite.y) {
                sprite.draw(ctx, gameFrame, screenX, screenY);
                drawn = true;
            } else if (entity.X < sprite.y && entity.Y === sprite.y) {
                sprite.draw(ctx, gameFrame, screenX, screenY);
                drawn = true;
            }
        }
        entity.draw(ctx, gameFrame);
    });

    if (!drawn) {
        sprite.draw(ctx, gameFrame, screenX, screenY);
    }

    // ----------------------
    // DEATH SCREEN
    // ----------------------
    if (isDead) {
        drawDeathScreen();
    }

    requestAnimationFrame(animate);
}

function drawTiles() {
    let grass = new Image(tileSize, tileSize);
    grass.src = "assets/Grass.png";

    for (let x = -tileSize; x < canvas.width + tileSize; x += tileSize) {
        for (let y = -tileSize; y < canvas.height + tileSize; y += tileSize) {
            ctx.drawImage(
                grass,
                x + tileOffsetX,
                y + tileOffsetY,
                tileSize,
                tileSize
            );
        }
    }
}

requestAnimationFrame(animate);
