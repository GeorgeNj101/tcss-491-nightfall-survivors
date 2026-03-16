import Entity from "./Entity.js";

export default class ChickenBoss extends Entity {
    constructor(camera) {
        // Calculate a spawn point just off-screen
        const spawnX = camera.x + (Math.random() > 0.5 ? -100 : camera.width + 100);
        const spawnY = camera.y + (Math.random() > 0.5 ? -100 : camera.height + 100);

        // --- FIXED SUPER CALL ---
        super(camera, {
            imagePath: "assets/Chicken_Enemy.png", // Put imagePath inside the config!
            x: spawnX,
            y: spawnY,
            cols: 4, 
            rows: 8,
            radius: 80,
            maxHp: 50,
            speed: 2,   
            damage: 30
        });
    }

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
}