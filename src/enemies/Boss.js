import Entity from "./Entity.js";
import Projectile from "../weapons/Projectile.js";

export default class Boss extends Entity {
    constructor(camera) {
        // Calculate a spawn point just off-screen
        const spawnX = camera.x + (Math.random() > 0.5 ? -100 : camera.width + 100);
        const spawnY = camera.y + (Math.random() > 0.5 ? -100 : camera.height + 100);

        // --- FIXED SUPER CALL ---
        super(camera, {
            imagePath: "assets/Demon.png", // Put imagePath inside the config!
            x: spawnX,
            y: spawnY,
            cols: 4,
            rows: 8,
            radius: 60,
            maxHp: 100,
            speed: 1.5,
            damage: 30
        });

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
        if (this.hp > 0) {
            // Make the boss health bar wider
            const barWidth = 80; 
            const barHeight = 8;
            
            // Center it over the pulsing sprite
            const barX = screenX + (this.frameWidth / 2) - (barWidth / 2);
            // Place it above the pulsing height
            const barY = screenY + (this.frameHeight / 2) - (drawH / 2) - 20; 

            // Background
            ctx.fillStyle = "black";
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Foreground
            const hpPercent = Math.max(0, this.hp / this.maxHp);
            ctx.fillStyle = "#ff4444"; 
            ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

            // Border
            ctx.strokeStyle = "gold"; // Give the boss a fancy gold border
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
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

        const bossAttackStats = {
            damage: 15,                 
            projectileSpeed: 400,       
            projectileSprite: "assets/Shuriken.png",
            cols: 6, // Add this based on your shuriken image layout
            rows: 1, // Add this based on your shuriken image layout
            fromEnemy: true,
            range: 10000
        };
        console.log("Boss shoots a projectile towards the player!");
        game.projectiles.push( new Projectile(cx, cy, vx, vy, bossAttackStats)
        );
    }
}
