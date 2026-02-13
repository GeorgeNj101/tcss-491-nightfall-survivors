import Entity from "./Entity.js";
import Projectile from "./Projectile.js";

export default class Boss extends Entity {
    constructor(camera) {
        super(camera);

        // Configure boss sprite sheet parameters BEFORE changing image src
        // Expected: place a boss sprite sheet at `assets/Boss.png`.
        // Recommended layout: 4 columns x 4 rows (idle/move/attack frames).
        this.cols = 4;
        this.rows = 4;
        this.radius = 60; // larger collision radius for boss

        // Replace the image source so Sprite's onload recalculates frames
        this.image.src = "assets/Boss.png";

        this.maxHp = 500;
        this.hp = this.maxHp;

        // Boss is faster than normal enemies
        this.speed = 3.5;

        // Shooting
        this.attackCooldown = 90; // frames
        this.attackTimer = 0;
    }

    // Custom draw: larger, slow-pulse scale, and independent animation speed
    draw(ctx, gameFrame, screenX, screenY) {
        if (!this.loaded) return;

        // Animation: use a slower cycle for boss
        const animFrame = Math.floor(gameFrame / 6) % this.cols;

        // Pulse scale for a breathing effect
        const pulse = 1 + Math.sin(gameFrame / 30) * 0.06;

        const drawW = this.frameWidth * 1.6 * pulse;
        const drawH = this.frameHeight * 1.6 * pulse;

        // Center the draw around the sprite position
        const dx = screenX + this.frameWidth / 2 - drawW / 2;
        const dy = screenY + this.frameHeight / 2 - drawH / 2;

        ctx.drawImage(
            this.image,
            animFrame * this.frameWidth, (this.direction * 2 + (this.moving ? 1 : 0)) * this.frameHeight,
            this.frameWidth, this.frameHeight,
            dx, dy,
            drawW, drawH
        );

        if (this.showHitbox) {
            ctx.beginPath();
            ctx.strokeStyle = "orange";
            ctx.arc(screenX + this.frameWidth/2, screenY + this.frameHeight/2, this.radius, 0, Math.PI*2);
            ctx.stroke();
        }
    }

    update(playerX, playerY, game) {
        // Use Entity movement toward player
        super.update(playerX, playerY);

        // Shooting logic
        this.attackTimer++;
        if (this.attackTimer >= this.attackCooldown) {
            this.attackTimer = 0;
            this.shootAt(playerX + 32, playerY + 32, game);
        }
    }

    shootAt(targetX, targetY, game) {
        // compute direction from boss center to target
        const cx = this.x + this.frameWidth / 2;
        const cy = this.y + this.frameHeight / 2;
        const dx = targetX - cx;
        const dy = targetY - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const vx = dx / dist;
        const vy = dy / dist;

        // spawn a projectile aimed at player
        const proj = new Projectile(cx, cy, vx, vy);
        // mark as enemy projectile (optional flag)
        proj.fromEnemy = true;
        game.projectiles.push(proj);
    }
}
